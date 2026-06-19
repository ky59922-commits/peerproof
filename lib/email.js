// Centralized email sending for PeerProof.
//
// Behaviour mirrors the transcription fallback: if RESEND_API_KEY is not set,
// emails are logged to the server console instead of being sent. This lets the
// entire email flow be built and tested for free. The moment RESEND_API_KEY and
// EMAIL_FROM are configured (with a verified domain), the same code sends real
// email — no code changes needed.
//
// Required env vars to go live:
//   RESEND_API_KEY   — from resend.com
//   EMAIL_FROM       — e.g. "PeerProof <noreply@yourdomain.com>" (verified domain)

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "PeerProof <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html }) {
  if (!to) {
    console.warn("[email] Skipped — no recipient address provided.");
    return { sent: false, reason: "no-recipient" };
  }

  if (!RESEND_API_KEY) {
    // No key configured — log instead of sending so the flow is fully testable.
    console.log("\n========== [EMAIL — NOT SENT, no RESEND_API_KEY] ==========");
    console.log("To:     ", to);
    console.log("Subject:", subject);
    console.log("From:   ", EMAIL_FROM);
    console.log("--- HTML body (first 600 chars) ---");
    console.log((html || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 600));
    console.log("===========================================================\n");
    return { sent: false, reason: "no-api-key", simulated: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[email] Resend API error:", text);
      return { sent: false, reason: "api-error", detail: text };
    }

    return { sent: true };
  } catch (e) {
    console.error("[email] Send failed:", e.message);
    return { sent: false, reason: "exception", detail: e.message };
  }
}
