import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RANK = { Undergraduate: 1, Master: 2, PhD: 3, PostDoc: 4 };

export async function GET(request) {
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

    // A judge can only have one active session at a time — fetch full details if so
    const { data: judgeSessions } = await supabaseAdmin
      .from("sessions")
      .select("id, assessment_id, scheduled_at, assessments(status, candidate_degree, candidate_field, hr_notes)")
      .eq("judge_id", judge.id);

    const active = (judgeSessions || []).find(s => s.assessments?.status === "in_progress");

    if (active) {
      return Response.json({
        busy: true,
        requests: [],
        activeSession: {
          sessionId: active.id,
          scheduledAt: active.scheduled_at,
          candidateDegree: active.assessments.candidate_degree,
          candidateField: active.assessments.candidate_field,
          hrNotes: active.assessments.hr_notes,
        },
      });
    }

    // Every assessment this judge has ever had a session for — used to exclude
    // them from re-evaluations of a candidate they already interviewed.
    const alreadyWorkedIds = new Set((judgeSessions || []).map(s => s.assessment_id));

    const judgeRank = RANK[judge.level] || 0;

    const { data: pendingAssessments, error: fetchError } = await supabaseAdmin
      .from("assessments")
      .select("id, candidate_degree, candidate_field, hr_notes, created_at, current_round, languages, proposed_slots(id, slot_time)")
      .eq("status", "pending")
      .eq("candidate_field", judge.field);

    if (fetchError) {
      return Response.json({ error: fetchError.message }, { status: 500 });
    }

    const eligible = (pendingAssessments || []).filter(
      a => judgeRank > (RANK[a.candidate_degree] || 0) && !alreadyWorkedIds.has(a.id)
    );

    return Response.json({ busy: false, requests: eligible });
  } catch (e) {
    return Response.json({ error: "Unexpected error: " + e.message }, { status: 500 });
  }
}
