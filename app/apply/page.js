'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Btn, Card, PW } from "@/components/ui";
import { N, MU, RD, ffH, ff } from "@/lib/theme";

export default function Apply() {
  const router = useRouter();
  const [f, setF] = useState({ company_name: "", contact_name: "", contact_email: "", message: "" });
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const upd = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #dde4ee", fontSize: 14, fontFamily: ff, boxSizing: "border-box" };

  async function submit() {
    if (!f.company_name || !f.contact_name || !f.contact_email) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    const { error: insertError } = await supabase.from("company_applications").insert({
      company_name: f.company_name,
      contact_name: f.contact_name,
      contact_email: f.contact_email,
      message: f.message || null,
    });
    setSubmitting(false);
    if (insertError) {
      setError("Something went wrong submitting your application. Please try again.");
      console.error(insertError);
      return;
    }
    // Fire-and-forget confirmation email (best-effort)
    fetch("/api/notify-company-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactName: f.contact_name, contactEmail: f.contact_email, companyName: f.company_name }),
    }).catch(() => {});
    setOk(true);
  }

  if (ok) {
    return (
      <PW>
        <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>✓</div>
          <h2 style={{ fontFamily: ffH, fontSize: 26, fontWeight: 800, color: N }}>Application received</h2>
          <p style={{ color: MU, marginTop: 12, lineHeight: 1.75, fontSize: 14 }}>
            Thank you for your interest in PeerProof. We'll review your application and get back to you at <strong>{f.contact_email}</strong> within a few business days.
          </p>
          <div style={{ marginTop: 28 }}><Btn ch="Back to homepage" onClick={() => router.push("/")} /></div>
        </div>
      </PW>
    );
  }

  return (
    <PW>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "36px 24px" }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", color: MU, fontSize: 13, marginBottom: 20, fontFamily: ff }}>← Back to homepage</button>
        <h1 style={{ fontFamily: ffH, fontSize: 26, fontWeight: 800, color: N, marginBottom: 6 }}>Apply for a PeerProof account</h1>
        <p style={{ color: MU, fontSize: 14, marginBottom: 28 }}>Tell us about your company. We review every application personally — once approved, we'll send you a company account code so your HR team can sign in.</p>
        <Card>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Company name <span style={{ color: RD }}>*</span></label>
              <input value={f.company_name} onChange={upd("company_name")} placeholder="e.g. Asahi Holdings" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Your name <span style={{ color: RD }}>*</span></label>
              <input value={f.contact_name} onChange={upd("contact_name")} placeholder="e.g. Tanaka Yuki" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Work email <span style={{ color: RD }}>*</span></label>
              <input type="email" value={f.contact_email} onChange={upd("contact_email")} placeholder="you@company.com" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>What are you hoping to use PeerProof for? <span style={{ color: MU, fontWeight: 400 }}>(optional)</span></label>
              <textarea value={f.message} onChange={upd("message")} rows={3} placeholder="e.g. Verifying graduate research claims for engineering hires" style={{ ...inp, resize: "vertical" }} />
            </div>
          </div>
          {error && <p style={{ color: RD, fontSize: 13, marginTop: 12 }}>{error}</p>}
          <div style={{ marginTop: 20 }}>
            <Btn ch={submitting ? "Submitting…" : "Submit application"} sz="lg" onClick={submit} />
          </div>
        </Card>
      </div>
    </PW>
  );
}
