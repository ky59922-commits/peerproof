import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { companyApproved, companyRejected } from "@/lib/emailTemplates";

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

    const { data: admin } = await supabaseAdmin
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!admin) return Response.json({ error: "Not an admin." }, { status: 403 });

    const { decision, contactName, contactEmail, companyName, joinCode, signupUrl } = await request.json();
    if (!contactEmail) return Response.json({ ok: false }, { status: 200 });

    const { subject, html } =
      decision === "approved"
        ? companyApproved({ contactName, companyName, joinCode, signupUrl })
        : companyRejected({ contactName, companyName });

    await sendEmail({ to: contactEmail, subject, html });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("notify-company-decision error:", e.message);
    return Response.json({ ok: false }, { status: 200 });
  }
}
