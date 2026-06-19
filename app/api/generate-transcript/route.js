import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function transcribeAudio(sessionId) {
  if (!process.env.OPENAI_API_KEY) {
    // No real API key configured yet — this is the expected state until the
    // business is actually live. Returning a clear placeholder lets the rest
    // of the pipeline (PDF generation, result display) be built and tested
    // for free. The moment OPENAI_API_KEY is set in the environment, this
    // function automatically switches to real transcription below —
    // no code changes needed.
    return "[Placeholder transcript — OpenAI transcription is not yet connected. This will be replaced with a real transcript automatically once OPENAI_API_KEY is configured.]";
  }

  try {
    const { data: files, error: listError } = await supabaseAdmin.storage.from("recordings").list(sessionId);
    if (listError || !files) return null;
    const audioFile = files.find(f => f.name.startsWith("audio-"));
    if (!audioFile) return null;

    const path = `${sessionId}/${audioFile.name}`;
    const { data: audioBlob, error: downloadError } = await supabaseAdmin.storage.from("recordings").download(path);
    if (downloadError || !audioBlob) return null;

    const arrayBuffer = await audioBlob.arrayBuffer();
    const formData = new FormData();
    formData.append("file", new Blob([arrayBuffer]), audioFile.name);
    formData.append("model", "gpt-4o-transcribe");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    });

    if (!res.ok) {
      console.error("Transcription API error:", await res.text());
      return null;
    }

    const data = await res.json();
    return data.text || null;
  } catch (e) {
    console.error("Transcription failed:", e.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: companyUser } = await supabaseAdmin
      .from("company_users")
      .select("company_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!companyUser) {
      return Response.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    const { assessmentId, round } = await request.json();
    if (!assessmentId) return Response.json({ error: "Missing assessment id." }, { status: 400 });
    const targetRound = round || 1;

    const { data: assessment } = await supabaseAdmin
      .from("assessments")
      .select("id, company_id")
      .eq("id", assessmentId)
      .maybeSingle();

    if (!assessment || assessment.company_id !== companyUser.company_id) {
      return Response.json({ error: "Assessment not found." }, { status: 404 });
    }

    // Find the session for this specific round
    const { data: sessionRow } = await supabaseAdmin
      .from("sessions")
      .select("id")
      .eq("assessment_id", assessmentId)
      .eq("round", targetRound)
      .maybeSingle();

    if (!sessionRow) {
      return Response.json({ error: "No session found for this round yet." }, { status: 404 });
    }

    const transcript = await transcribeAudio(sessionRow.id);
    if (!transcript) {
      return Response.json({ error: "Transcription failed — the recording may be missing or unavailable." }, { status: 500 });
    }

    // Update only this round's result row
    const { error: updateError } = await supabaseAdmin
      .from("results")
      .update({ audio_transcript: transcript })
      .eq("assessment_id", assessmentId)
      .eq("round", targetRound);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ success: true, transcript });
  } catch (e) {
    return Response.json({ error: "Unexpected error: " + e.message }, { status: 500 });
  }
}
