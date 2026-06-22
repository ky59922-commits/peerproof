import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { reportReady } from "@/lib/emailTemplates";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
      .select("id, sessions_completed")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!judge) {
      return Response.json({ error: "Not a registered judge." }, { status: 403 });
    }

    const { sessionId, knowledgeScore, deltaScore, notes } = await request.json();
    if (!sessionId || !knowledgeScore || deltaScore === undefined || deltaScore === null) {
      return Response.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (deltaScore <= -2 && (!notes || notes.length < 20)) {
      return Response.json({ error: "A written justification of at least 20 characters is required for Δ ≤ -2." }, { status: 400 });
    }

    // The session must actually belong to this judge — never trust the client alone
    const { data: sessionRow } = await supabaseAdmin
      .from("sessions")
      .select("id, assessment_id, judge_id, round, assessments(status)")
      .eq("id", sessionId)
      .maybeSingle();

    if (!sessionRow || sessionRow.judge_id !== judge.id) {
      return Response.json({ error: "This session does not belong to you." }, { status: 403 });
    }
    if (sessionRow.assessments?.status === "completed") {
      return Response.json({ error: "This session has already been scored." }, { status: 409 });
    }

    const { error: resultError } = await supabaseAdmin.from("results").insert({
      assessment_id: sessionRow.assessment_id,
      knowledge_score: knowledgeScore,
      delta_score: deltaScore,
      judge_notes: notes || null,
      round: sessionRow.round || 1,
    });

    if (resultError) {
      return Response.json({ error: "Failed to save result: " + resultError.message }, { status: 500 });
    }

    // Completing the assessment frees the judge up to accept a new request again
    await supabaseAdmin.from("assessments").update({ status: "completed" }).eq("id", sessionRow.assessment_id);
    await supabaseAdmin.from("sessions").update({ ended_at: new Date().toISOString() }).eq("id", sessionId);
    await supabaseAdmin.from("judges").update({ sessions_completed: (judge.sessions_completed || 0) + 1 }).eq("id", judge.id);

    // ---- Report-ready notification to HR (best-effort) ----
    try {
      const { data: assessment } = await supabaseAdmin
        .from("assessments")
        .select("candidate_name, created_by, company_id")
        .eq("id", sessionRow.assessment_id)
        .maybeSingle();

      let hrEmail = null;
      if (assessment?.created_by) {
        const { data: cu } = await supabaseAdmin
          .from("company_users")
          .select("user_id")
          .eq("id", assessment.created_by)
          .maybeSingle();
        if (cu?.user_id) {
          const { data: hrUser } = await supabaseAdmin.auth.admin.getUserById(cu.user_id);
          hrEmail = hrUser?.user?.email || null;
        }
      }
      if (!hrEmail && assessment?.company_id) {
        const { data: company } = await supabaseAdmin
          .from("companies")
          .select("email")
          .eq("id", assessment.company_id)
          .maybeSingle();
        hrEmail = company?.email || null;
      }

      if (hrEmail) {
        const origin = new URL(request.url).origin;
        const tpl = reportReady({
          candidateName: assessment.candidate_name,
          resultUrl: `${origin}/hr/result?id=${sessionRow.assessment_id}`,
        });
        await sendEmail({ to: hrEmail, subject: tpl.subject, html: tpl.html });
      }
    } catch (notifyErr) {
      console.error("report-ready notification failed:", notifyErr.message);
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Unexpected error: " + e.message }, { status: 500 });
  }
}
