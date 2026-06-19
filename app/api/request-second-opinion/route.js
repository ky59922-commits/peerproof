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

    const { assessmentId, slots } = await request.json();
    if (!assessmentId) return Response.json({ error: "Missing assessment id." }, { status: 400 });
    if (!Array.isArray(slots) || slots.length === 0) {
      return Response.json({ error: "Please provide at least one time the candidate is available." }, { status: 400 });
    }

    const { data: assessment } = await supabaseAdmin
      .from("assessments")
      .select("id, company_id, status, current_round")
      .eq("id", assessmentId)
      .maybeSingle();

    if (!assessment || assessment.company_id !== companyUser.company_id) {
      return Response.json({ error: "Assessment not found." }, { status: 404 });
    }
    if (assessment.status !== "completed") {
      return Response.json({ error: "Only a completed assessment can be sent for a second opinion." }, { status: 409 });
    }

    // Clear any leftover proposed slots from the previous round and add the fresh ones
    await supabaseAdmin.from("proposed_slots").delete().eq("assessment_id", assessmentId);
    const slotRows = slots.map(s => ({ assessment_id: assessmentId, slot_time: new Date(s).toISOString() }));
    const { error: slotsError } = await supabaseAdmin.from("proposed_slots").insert(slotRows);
    if (slotsError) {
      return Response.json({ error: "Failed to save time slots: " + slotsError.message }, { status: 500 });
    }

    // Bump the round and reopen into the judge queue
    const { error: updateError } = await supabaseAdmin
      .from("assessments")
      .update({ status: "pending", current_round: (assessment.current_round || 1) + 1 })
      .eq("id", assessmentId);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Unexpected error: " + e.message }, { status: 500 });
  }
}
