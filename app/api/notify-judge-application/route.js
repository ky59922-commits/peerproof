import { sendEmail } from "@/lib/email";
import { judgeApplicationReceived } from "@/lib/emailTemplates";

export async function POST(request) {
  try {
    const { name, email } = await request.json();
    if (!email) return Response.json({ ok: false }, { status: 200 });
    const { subject, html } = judgeApplicationReceived({ name });
    await sendEmail({ to: email, subject, html });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("notify-judge-application error:", e.message);
    return Response.json({ ok: false }, { status: 200 });
  }
}
