'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRequireCompanyUser } from "@/lib/useRequireCompanyUser";
import { Btn, Card, Sep, PW } from "@/components/ui";
import { N, TE, MU, BR, RD, TEL, FIELDS, DEGREES, ffH, ff } from "@/lib/theme";

export default function HRNew() {
  const router = useRouter();
  const { checking, user } = useRequireCompanyUser();
  const [f, setF] = useState({ name: "", email: "", degree: "Undergraduate", field: "Machine Learning / AI", univ: "", notes: "" });
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const upd = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${BR}`, fontSize: 14, fontFamily: ff, boxSizing: "border-box" };

  async function submit() {
    if (!f.name || !f.email) {
      setError("Please fill in the candidate's name and email.");
      return;
    }
    setSubmitting(true);
    setError("");
    const { error: insertError } = await supabase.from("assessments").insert({
      company_id: user.companyId,
      created_by: user.membershipId,
      candidate_name: f.name,
      candidate_email: f.email,
      candidate_degree: f.degree,
      candidate_field: f.field,
      candidate_university: f.univ || null,
      hr_notes: f.notes || null,
    });
    setSubmitting(false);
    if (insertError) {
      setError("Something went wrong: " + insertError.message);
      return;
    }
    setOk(true);
  }

  if (checking) {
    return <PW><div style={{ padding: 60, textAlign: "center", color: MU }}>Checking access…</div></PW>;
  }

  if (ok) {
    return (
      <PW>
        <div style={{ maxWidth: 520, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>✓</div>
          <h2 style={{ fontFamily: ffH, fontSize: 26, fontWeight: 800, color: N }}>Assessment requested</h2>
          <p style={{ color: MU, marginTop: 12, lineHeight: 1.75, fontSize: 14 }}>
            We've received your request for <strong>{f.name}</strong>. A matching judge will be assigned within 24 hours and both parties will receive private session links by email.
          </p>
          <div style={{ marginTop: 28 }}><Btn ch="Back to dashboard" onClick={() => router.push("/hr")} /></div>
        </div>
      </PW>
    );
  }

  return (
    <PW>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 24px" }}>
        <button onClick={() => router.push("/hr")} style={{ background: "none", border: "none", cursor: "pointer", color: MU, fontSize: 13, marginBottom: 20, fontFamily: ff }}>← Dashboard</button>
        <h1 style={{ fontFamily: ffH, fontSize: 26, fontWeight: 800, color: N, marginBottom: 6 }}>New assessment request</h1>
        <p style={{ color: MU, fontSize: 14, marginBottom: 28 }}>We'll match a verified peer in the same sub-field for a 20–30 min session.</p>
        <Card>
          <h2 style={{ fontFamily: ffH, fontSize: 15, fontWeight: 700, color: N, marginBottom: 18 }}>Candidate information</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Full name <span style={{ color: RD }}>*</span></label>
              <input value={f.name} onChange={upd("name")} placeholder="e.g. Tanaka Hiroshi" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Email address <span style={{ color: RD }}>*</span></label>
              <input type="email" value={f.email} onChange={upd("email")} placeholder="candidate@email.com" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Claimed degree level <span style={{ color: RD }}>*</span></label>
              <select value={f.degree} onChange={upd("degree")} style={inp}>{DEGREES.map(d => <option key={d}>{d}</option>)}</select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Study field <span style={{ color: RD }}>*</span></label>
              <select value={f.field} onChange={upd("field")} style={inp}>{FIELDS.map(d => <option key={d}>{d}</option>)}</select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Claimed university</label>
              <input value={f.univ} onChange={upd("univ")} placeholder="e.g. University of Tokyo" style={inp} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Notes for judge <span style={{ color: MU, fontWeight: 400 }}>(optional)</span></label>
              <textarea value={f.notes} onChange={upd("notes")} rows={3} placeholder="e.g. Candidate claims 3 years of NLP research. Please probe this specifically." style={{ ...inp, resize: "vertical" }} />
            </div>
          </div>
          <Sep />
          <div style={{ background: TEL, borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: TE, marginBottom: 6 }}>What happens next</p>
            <ul style={{ fontSize: 13, color: MU, paddingLeft: 16, lineHeight: 1.85, margin: 0 }}>
              <li>We match a judge with higher academic standing in the same field</li>
              <li>Candidate and judge each receive an anonymous private link by email</li>
              <li>Session is recorded (20–30 min). Both consent on joining.</li>
              <li>You receive the full report within 24 hours of the session</li>
            </ul>
          </div>
          {error && <p style={{ color: RD, fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <Btn ch={submitting ? "Submitting…" : "Submit request"} sz="lg" onClick={submit} />
        </Card>
      </div>
    </PW>
  );
}
