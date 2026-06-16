import { createClient } from "@supabase/supabase-js";

// This uses the SERVICE ROLE key — full database access, bypasses RLS.
// This file only ever runs on the server, never in the browser.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { joinCode, name, email, password } = await request.json();

    if (!joinCode || !name || !email || !password) {
      return Response.json({ error: "All fields are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    // 1. Find the company this code belongs to
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, max_hr_users")
      .eq("join_code", joinCode.trim().toUpperCase())
      .maybeSingle();

    if (companyError || !company) {
      return Response.json({ error: "Invalid account code." }, { status: 400 });
    }

    // 2. Enforce the cap on HR users per company
    const { count, error: countError } = await supabaseAdmin
      .from("company_users")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id);

    if (countError) {
      return Response.json({ error: "Could not verify account capacity." }, { status: 500 });
    }
    if (count >= company.max_hr_users) {
      return Response.json({ error: "This company has reached its maximum number of HR accounts." }, { status: 400 });
    }

    // 3. Create the actual login
    const { data: userData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError) {
      return Response.json({ error: createUserError.message }, { status: 400 });
    }

    // 4. Link the new login to the company. First person in becomes admin.
    const role = count === 0 ? "admin" : "member";
    const { error: insertError } = await supabaseAdmin.from("company_users").insert({
      company_id: company.id,
      user_id: userData.user.id,
      name,
      role,
    });

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Unexpected error: " + e.message }, { status: 500 });
  }
}
