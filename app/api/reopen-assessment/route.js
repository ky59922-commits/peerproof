import { createClient } from "@supabase/supabase-js";

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

    const { data: companyUser } = await supabaseAdmin
      .from("company_users")
      .select("company_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!companyUser) {
      return Response.json({ error: "Not authorized for this action." }, { status: 403 });
    }

    const { assessmentId } = await request.json();
    if (!assessmentId) return Response.json({ error: "Missing assessment id." }, { status: 400 });

    const { data: assessment } = await supabaseAdmin
      .from("assessments")
      .select("id, company_id, status, proposed_slots(id)")
      .eq("id", assessmentId)
      .maybeSingle();

    if (!assessment || assessment.company_id !== companyUser.company_id) {
      return Response.json({ error: "Assessment not found." }, { status: 404 });
    }
    if (assessment.status !== "cancelled") {
      return Response.json({ error: "Only a cancelled assessment can be reopened." }, { status: 409 });
    }
    if (!assessment.proposed_slots || assessment.proposed_slots.length === 0) {
      return Response.json({ error: "This assessment has no time slots left. Please create a new assessment instead." }, { status: 409 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("assessments")
      .update({ status: "pending" })
      .eq("id", assessmentId);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Unexpected error: " + e.message }, { status: 500 });
  }
}
