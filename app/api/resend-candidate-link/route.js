import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { candidateMeetingLink } from "@/lib/emailTemplates";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    if (!userData?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: companyUser } = await supabaseAdmin
      .from("company_users")
      .select("company_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!companyUser) return Response.json({ error: "Not authorized for this action." }, { status: 403 });

    const { assessmentId } = await request.json();
    if (!assessmentId) return Response.json({ error: "Missing assessment id." }, { status: 400 });

    const { data: assessment } = await supabaseAdmin
      .from("assessments")
      .select("id, company_id, candidate_name, candidate_email, current_round")
      .eq("id", assessmentId)
      .maybeSingle();

    if (!assessment || assessment.company_id !== companyUser.company_id) {
      return Response.json({ error: "Assessment not found." }, { status: 404 });
    }
    if (!assessment.candidate_email) {
      return Response.json({ error: "No candidate email on file for this assessment." }, { status: 409 });
    }

    // Find the active session (latest round) so we email the correct meeting link
    const { data: sessions } = await supabaseAdmin
      .from("sessions")
      .select("id, round, scheduled_at")
      .eq("assessment_id", assessmentId);

    if (!sessions || sessions.length === 0) {
      return Response.json({ error: "No session yet — a judge hasn't accepted this assessment." }, { status: 409 });
    }

    const latest = sessions.slice().sort((a, b) => (b.round || 1) - (a.round || 1))[0];
    const origin = new URL(request.url).origin;
    const meetingUrl = `${origin}/candidate?s=${latest.id}`;
    const isSecondOpinion = (assessment.current_round || 1) > 1;

    const tpl = candidateMeetingLink({
      candidateName: assessment.candidate_name,
      meetingUrl,
      scheduledAt: latest.scheduled_at,
      isSecondOpinion,
    });
    const result = await sendEmail({ to: assessment.candidate_email, subject: tpl.subject, html: tpl.html });

    if (!result.sent && !result.simulated) {
      return Response.json({ error: "Failed to send. Please try again shortly." }, { status: 500 });
    }
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Unexpected error: " + e.message }, { status: 500 });
  }
}
