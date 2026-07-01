'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRequireCompanyUser } from "@/lib/useRequireCompanyUser";
import { Btn, Card, Sep, PW } from "@/components/ui";
import { LanguagePicker } from "@/components/LanguagePicker";
import { FocusEditor, hasFocus } from "@/components/Focus";
import { CountrySelect, ExperienceEditor } from "@/components/CandidateInfo";
import { N, TE, MU, BR, RD, TEL, FIELDS, DEGREES, ffH, ff } from "@/lib/theme";

export default function HRNew() {
  const router = useRouter();
  const { checking, user } = useRequireCompanyUser();
  const [f, setF] = useState({ name: "", email: "", degree: "Undergraduate", field: "Machine Learning / AI", univ: "", slot1: "", slot2: "", slot3: "" });
  const [languages, setLanguages] = useState([]);
  const [focus, setFocus] = useState({ tags: [], topics: "", skills: "", concerns: "" });
  const [nationality, setNationality] = useState("");
  const [experience, setExperience] = useState([]);
  const [focusOpen, setFocusOpen] = useState(false);
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
    const slots = [f.slot1, f.slot2, f.slot3].filter(Boolean);
    if (slots.length === 0) {
      setError("Please provide at least one time the candidate is available.");
      return;
    }
    setSubmitting(true);
    setError("");

    const { data: assessment, error: insertError } = await supabase.from("assessments").insert({
      company_id: user.companyId,
      created_by: user.membershipId,
      candidate_name: f.name,
      candidate_email: f.email,
      candidate_degree: f.degree,
      candidate_field: f.field,
      candidate_university: f.univ || null,
      candidate_nationality: nationality || null,
      work_experience: experience.filter(e => e.field && e.field.trim()),
      focus: focus,
      languages: languages,
    }).select().single();

    if (insertError) {
      setSubmitting(false);
      setError("Something went wrong: " + insertError.message);
      return;
    }

    const slotRows = slots.map(s => ({ assessment_id: assessment.id, slot_time: new Date(s).toISOString() }));
    const { error: slotsError } = await supabase.from("proposed_slots").insert(slotRows);

    setSubmitting(false);
    if (slotsError) {
      setError("Assessment created, but failed to save time slots: " + slotsError.message);
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
            We've received your request for <strong>{f.name}</strong>. Eligible judges can now accept one of the proposed times — you'll see it confirmed on your dashboard once matched.
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
        <p style={{ color: MU, fontSize: 14, marginBottom: 28 }}>We'll match a verified peer in the same sub-field. Provide a few times your candidate is available — the first eligible judge to accept one locks it in.</p>
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
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Claimed university</label>
              <input value={f.univ} onChange={upd("univ")} placeholder="e.g. University of Tokyo" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Nationality <span style={{ color: MU, fontWeight: 400 }}>(optional)</span></label>
              <CountrySelect value={nationality} onChange={setNationality} font={ff} />
            </div>
          </div>
          <Sep />
          <h2 style={{ fontFamily: ffH, fontSize: 15, fontWeight: 700, color: N, marginBottom: 6 }}>Candidate's languages <span style={{ color: MU, fontWeight: 400, fontSize: 13 }}>(optional)</span></h2>
          <p style={{ fontSize: 12, color: MU, marginBottom: 14 }}>Add the languages the candidate can be interviewed in, and their level in each. Judges see this to confirm they can conduct the interview.</p>
          <div style={{ marginBottom: 20 }}>
            <LanguagePicker value={languages} onChange={setLanguages} font={ff} />
          </div>
          <Sep />
          <h2 style={{ fontFamily: ffH, fontSize: 15, fontWeight: 700, color: N, marginBottom: 6 }}>Work experience <span style={{ color: MU, fontWeight: 400, fontSize: 13 }}>(optional)</span></h2>
          <p style={{ fontSize: 12, color: MU, marginBottom: 14 }}>Add each field the candidate has worked in, and roughly how many years.</p>
          <div style={{ marginBottom: 20 }}>
            <ExperienceEditor value={experience} onChange={setExperience} font={ff} />
          </div>
          <Sep />
          <button
            type="button"
            onClick={() => setFocusOpen(o => !o)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: ff }}
          >
            <span style={{ fontFamily: ffH, fontSize: 15, fontWeight: 700, color: N }}>
              What should the judge focus on? <span style={{ color: MU, fontWeight: 400, fontSize: 13 }}>(optional)</span>
            </span>
            <span style={{ fontSize: 13, color: TE, display: "flex", alignItems: "center", gap: 6 }}>
              {hasFocus(focus) && !focusOpen && <span style={{ fontSize: 11, color: TE, fontWeight: 600 }}>added</span>}
              {focusOpen ? "▲" : "▼"}
            </span>
          </button>
          {focusOpen && (
            <div style={{ marginTop: 12, marginBottom: 20, paddingTop: 12 }}>
              <FocusEditor value={focus} onChange={setFocus} font={ff} />
            </div>
          )}
          <Sep />
          <h2 style={{ fontFamily: ffH, fontSize: 15, fontWeight: 700, color: N, marginBottom: 6 }}>When is the candidate available? <span style={{ color: RD }}>*</span></h2>
          <p style={{ fontSize: 12, color: MU, marginBottom: 14 }}>Provide at least one option — more increases the chance of a quick match.</p>
          <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
            <input type="datetime-local" value={f.slot1} onChange={upd("slot1")} style={inp} />
            <input type="datetime-local" value={f.slot2} onChange={upd("slot2")} style={inp} />
            <input type="datetime-local" value={f.slot3} onChange={upd("slot3")} style={inp} />
          </div>
          <div style={{ background: TEL, borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: TE, marginBottom: 6 }}>What happens next</p>
            <ul style={{ fontSize: 13, color: MU, paddingLeft: 16, lineHeight: 1.85, margin: 0 }}>
              <li>Eligible judges (matched field, higher academic standing) see your proposed times</li>
              <li>The first judge to accept one locks in that time</li>
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
