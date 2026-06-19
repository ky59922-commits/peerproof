import { sendEmail } from "@/lib/email";
import { companyApplicationReceived } from "@/lib/emailTemplates";

export async function POST(request) {
  try {
    const { contactName, contactEmail, companyName } = await request.json();
    if (!contactEmail) return Response.json({ ok: false }, { status: 200 });
    const { subject, html } = companyApplicationReceived({ contactName, companyName });
    await sendEmail({ to: contactEmail, subject, html });
    return Response.json({ ok: true });
  } catch (e) {
    // Email is best-effort — never fail the user's action because of it
    console.error("notify-company-application error:", e.message);
    return Response.json({ ok: false }, { status: 200 });
  }
}
