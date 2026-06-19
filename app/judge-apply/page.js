'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Btn, Card, PW } from "@/components/ui";
import { N, MU, RD, FIELDS, ffH, ff } from "@/lib/theme";

const DEGREE_LEVELS = ["Master", "PhD", "PostDoc"];
const YEAR_OPTIONS = {
  Master: ["M1", "M2"],
  PhD: ["D1", "D2", "D3", "D4+"],
  PostDoc: ["1st year", "2nd year", "3rd year+"],
};

export default function JudgeApply() {
  const router = useRouter();
  const [f, setF] = useState({
    name: "", university_email: "", phone: "", university: "",
    degree_level: "Master", program_year: "M1", field: FIELDS[0],
    lab_info: "", lab_url: "", research_summary: "",
  });
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const upd = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const updDegree = e => {
    const degree_level = e.target.value;
    setF(p => ({ ...p, degree_level, program_year: YEAR_OPTIONS[degree_level][0] }));
  };
  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #dde4ee", fontSize: 14, fontFamily: ff, boxSizing: "border-box" };

  async function submit() {
    if (!f.name || !f.university_email || !f.phone || !f.university || !f.lab_info || !f.research_summary) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    const { error: insertError } = await supabase.from("judge_applications").insert({
      name: f.name,
      university_email: f.university_email,
      phone: f.phone,
      university: f.university,
      degree_level: f.degree_level,
      program_year: f.program_year,
      field: f.field,
      lab_info: f.lab_info,
      lab_url: f.lab_url || null,
      research_summary: f.research_summary,
    });
    setSubmitting(false);
    if (insertError) {
      setError("Something went wrong: " + insertError.message);
      return;
    }
    fetch("/api/notify-judge-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.name, email: f.university_email }),
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
            Thank you for applying to be a PeerProof judge. We'll review your application and email <strong>{f.university_email}</strong> with next steps.
          </p>
          <div style={{ marginTop: 28 }}><Btn ch="Back to homepage" onClick={() => router.push("/")} /></div>
        </div>
      </PW>
    );
  }

  return (
    <PW>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "36px 24px" }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", color: MU, fontSize: 13, marginBottom: 20, fontFamily: ff }}>← Back to homepage</button>
        <h1 style={{ fontFamily: ffH, fontSize: 26, fontWeight: 800, color: N, marginBottom: 6 }}>Apply to be a PeerProof judge</h1>
        <p style={{ color: MU, fontSize: 14, marginBottom: 28 }}>Review academic peer interviews and get paid per session. Open to Master's, PhD, and PostDoc students with a university email address.</p>
        <Card>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Full name <span style={{ color: RD }}>*</span></label>
              <input value={f.name} onChange={upd("name")} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>University email <span style={{ color: RD }}>*</span></label>
              <input type="email" value={f.university_email} onChange={upd("university_email")} placeholder="you@g.ecc.u-tokyo.ac.jp" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Phone number <span style={{ color: RD }}>*</span></label>
              <input type="tel" value={f.phone} onChange={upd("phone")} placeholder="090-1234-5678" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>University <span style={{ color: RD }}>*</span></label>
              <input value={f.university} onChange={upd("university")} placeholder="e.g. University of Tokyo" style={inp} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Degree level <span style={{ color: RD }}>*</span></label>
                <select value={f.degree_level} onChange={updDegree} style={inp}>{DEGREE_LEVELS.map(d => <option key={d}>{d}</option>)}</select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Year <span style={{ color: RD }}>*</span></label>
                <select value={f.program_year} onChange={upd("program_year")} style={inp}>{YEAR_OPTIONS[f.degree_level].map(y => <option key={y}>{y}</option>)}</select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Field of study <span style={{ color: RD }}>*</span></label>
              <select value={f.field} onChange={upd("field")} style={inp}>{FIELDS.map(d => <option key={d}>{d}</option>)}</select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Lab name / advisor's name <span style={{ color: RD }}>*</span></label>
              <input value={f.lab_info} onChange={upd("lab_info")} placeholder="e.g. Tanaka Lab, Dept. of Information Science" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Lab / department page <span style={{ color: MU, fontWeight: 400 }}>(optional)</span></label>
              <input value={f.lab_url} onChange={upd("lab_url")} placeholder="link to a page listing you as a member" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Describe your research in 2–3 sentences <span style={{ color: RD }}>*</span></label>
              <textarea value={f.research_summary} onChange={upd("research_summary")} rows={3} style={{ ...inp, resize: "vertical" }} />
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
