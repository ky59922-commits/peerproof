import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { signupCode, password } = await request.json();

    if (!signupCode || !password) {
      return Response.json({ error: "All fields are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const { data: judge, error: judgeError } = await supabaseAdmin
      .from("judges")
      .select("id, email, user_id")
      .eq("signup_code", signupCode.trim().toUpperCase())
      .maybeSingle();

    if (judgeError || !judge) {
      return Response.json({ error: "Invalid signup code." }, { status: 400 });
    }
    if (judge.user_id) {
      return Response.json({ error: "This code has already been used." }, { status: 400 });
    }

    const { data: userData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: judge.email,
      password,
      email_confirm: true,
    });

    if (createUserError) {
      return Response.json({ error: createUserError.message }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("judges")
      .update({ user_id: userData.user.id, active: true, signup_code: null })
      .eq("id", judge.id);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Unexpected error: " + e.message }, { status: 500 });
  }
}
