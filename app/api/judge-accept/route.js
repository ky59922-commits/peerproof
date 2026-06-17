import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RANK = { Undergraduate: 1, Master: 2, PhD: 3, PostDoc: 4 };

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: judge } = await supabaseAdmin
      .from("judges")
      .select("id, field, level")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!judge) {
      return Response.json({ error: "Not a registered judge." }, { status: 403 });
    }

    const { assessmentId, slotId } = await request.json();
    if (!assessmentId || !slotId) {
      return Response.json({ error: "Missing assessment or slot." }, { status: 400 });
    }

    // Re-check: judge must not already have an active session
    const { data: activeSessions } = await supabaseAdmin
      .from("sessions")
      .select("id, assessments(status)")
      .eq("judge_id", judge.id);
    const hasActive = (activeSessions || []).some(s => s.assessments?.status === "in_progress");
    if (hasActive) {
      return Response.json({ error: "You already have an active session. Complete it before accepting another." }, { status: 400 });
    }

    // Re-check eligibility against the live assessment data — never trust the client alone
    const { data: assessment } = await supabaseAdmin
      .from("assessments")
      .select("*")
      .eq("id", assessmentId)
      .maybeSingle();

    if (!assessment || assessment.status !== "pending") {
      return Response.json({ error: "This request is no longer available." }, { status: 409 });
    }
    if (assessment.candidate_field !== judge.field || (RANK[judge.level] || 0) <= (RANK[assessment.candidate_degree] || 0)) {
      return Response.json({ error: "You are not eligible for this request." }, { status: 403 });
    }

    const { data: slot } = await supabaseAdmin
      .from("proposed_slots")
      .select("*")
      .eq("id", slotId)
      .eq("assessment_id", assessmentId)
      .maybeSingle();

    if (!slot) {
      return Response.json({ error: "That time slot no longer exists." }, { status: 400 });
    }

    // Atomic claim — succeeds only if no one else has already grabbed this assessment.
    // If two judges click at nearly the same instant, only the first update affects a row.
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("assessments")
      .update({ status: "in_progress" })
      .eq("id", assessmentId)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    if (updateError || !updated) {
      return Response.json({ error: "Someone else already accepted this request." }, { status: 409 });
    }

    const { data: newSession, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .insert({ assessment_id: assessmentId, judge_id: judge.id, scheduled_at: slot.slot_time })
      .select()
      .single();

    if (sessionError) {
      await supabaseAdmin.from("assessments").update({ status: "pending" }).eq("id", assessmentId);
      return Response.json({ error: "Failed to create session: " + sessionError.message }, { status: 500 });
    }

    return Response.json({ success: true, session: newSession });
  } catch (e) {
    return Response.json({ error: "Unexpected error: " + e.message }, { status: 500 });
  }
}
