import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { candidateMeetingLink, judgeSessionConfirmation, hrMatchNotification } from "@/lib/emailTemplates";

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
    const { data: judgeSessions } = await supabaseAdmin
      .from("sessions")
      .select("id, assessment_id, assessments(status)")
      .eq("judge_id", judge.id);
    const hasActive = (judgeSessions || []).some(s => s.assessments?.status === "in_progress");
    if (hasActive) {
      return Response.json({ error: "You already have an active session. Complete it before accepting another." }, { status: 400 });
    }

    // Exclude assessments this judge has already worked on (re-evaluation rule)
    const alreadyWorked = (judgeSessions || []).some(s => s.assessment_id === assessmentId);
    if (alreadyWorked) {
      return Response.json({ error: "You have already judged this candidate and cannot take their re-evaluation." }, { status: 403 });
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

    // Tag the session with the assessment's current round (1 = original, 2 = second opinion)
    const { data: newSession, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .insert({ assessment_id: assessmentId, judge_id: judge.id, scheduled_at: slot.slot_time, round: updated.current_round || 1 })
      .select()
      .single();

    if (sessionError) {
      await supabaseAdmin.from("assessments").update({ status: "pending" }).eq("id", assessmentId);
      return Response.json({ error: "Failed to create session: " + sessionError.message }, { status: 500 });
    }

    // ---- Notifications (best-effort; never block a successful accept) ----
    try {
      const origin = new URL(request.url).origin;
      const isSecondOpinion = (updated.current_round || 1) > 1;

      // Judge details (name + email) for their confirmation
      const { data: judgeFull } = await supabaseAdmin
        .from("judges")
        .select("name, email")
        .eq("id", judge.id)
        .maybeSingle();

      // HR creator email — assessment.created_by points at a company_users row
      let hrEmail = null;
      if (updated.created_by) {
        const { data: cu } = await supabaseAdmin
          .from("company_users")
          .select("user_id")
          .eq("id", updated.created_by)
          .maybeSingle();
        if (cu?.user_id) {
          const { data: hrUser } = await supabaseAdmin.auth.admin.getUserById(cu.user_id);
          hrEmail = hrUser?.user?.email || null;
        }
      }

      const meetingUrl = `${origin}/candidate?s=${newSession.id}`;
      const judgeMeetingUrl = `${origin}/judge/meeting?s=${newSession.id}`;

      // 7/11 — candidate meeting link
      if (updated.candidate_email) {
        const tpl = candidateMeetingLink({
          candidateName: updated.candidate_name,
          meetingUrl,
          scheduledAt: slot.slot_time,
          isSecondOpinion,
        });
        await sendEmail({ to: updated.candidate_email, subject: tpl.subject, html: tpl.html });
      }

      // 8 — judge session confirmation
      if (judgeFull?.email) {
        const tpl = judgeSessionConfirmation({
          judgeName: judgeFull.name,
          scheduledAt: slot.slot_time,
          candidateField: updated.candidate_field,
          candidateDegree: updated.candidate_degree,
          meetingUrl: judgeMeetingUrl,
        });
        await sendEmail({ to: judgeFull.email, subject: tpl.subject, html: tpl.html });
      }

      // 9 — HR match notification
      if (hrEmail) {
        const tpl = hrMatchNotification({
          candidateName: updated.candidate_name,
          scheduledAt: slot.slot_time,
        });
        await sendEmail({ to: hrEmail, subject: tpl.subject, html: tpl.html });
      }
    } catch (notifyErr) {
      console.error("judge-accept notifications failed:", notifyErr.message);
    }

    return Response.json({ success: true, session: newSession });
  } catch (e) {
    return Response.json({ error: "Unexpected error: " + e.message }, { status: 500 });
  }
}
