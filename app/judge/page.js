'use client';
import { useRouter } from "next/navigation";
import { Btn, Card, Sep, PW } from "@/components/ui";
import { N, TE, TEL, MU, TX, ffH } from "@/lib/theme";

export default function JudgeBrief() {
  const router = useRouter();
  return (
    <PW>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 36, fontFamily: ffH, fontWeight: 800, color: TE }}>Δ</div>
          <h1 style={{ fontFamily: ffH, fontSize: 26, fontWeight: 800, color: N, margin: "8px 0 4px" }}>Judge briefing</h1>
          <p style={{ color: MU, fontSize: 13 }}>Read carefully before your session</p>
        </div>
        <Card sx={{ marginBottom: 18, borderLeft: `4px solid ${TE}`, borderRadius: "0 12px 12px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: MU, letterSpacing: "0.06em", marginBottom: 14 }}>CANDIDATE PROFILE — UNVERIFIED CV CLAIMS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[["Claimed degree", "Master's in Computer Science"], ["Claimed university", "Osaka University"], ["Claimed field", "Machine Learning / AI"], ["Claimed experience", "3 years research (NLP focus)"]].map(([k, v]) => (
              <div key={k}><div style={{ fontSize: 11, color: MU, marginBottom: 2 }}>{k}</div><div style={{ fontSize: 14, fontWeight: 600, color: TX }}>{v}</div></div>
            ))}
          </div>
          <Sep />
          <div style={{ fontSize: 11, fontWeight: 600, color: MU, marginBottom: 6 }}>HR NOTE</div>
          <p style={{ fontSize: 13, color: TX, fontStyle: "italic", lineHeight: 1.65 }}>"Candidate claims 3 years of ML research experience in NLP. Please probe this specifically."</p>
        </Card>
        <Card sx={{ marginBottom: 18 }}>
          <h3 style={{ fontFamily: ffH, fontSize: 15, fontWeight: 700, color: N, marginBottom: 14 }}>Session guidelines</h3>
          {[["🕐", "Keep the session to 20–30 minutes."], ["🔒", "Do not reveal your name, institution, or level. You are fully anonymous."], ["📋", "Ask at least 2 technical questions, 1 methodology question, and 1 'explain simply' question."], ["⚖️", "Be fair. Nerves ≠ incompetence. Probe gently but clearly."], ["✍️", "You will score after the session. Take brief notes during if needed."]].map(([ic, t]) => (
            <div key={t} style={{ display: "flex", gap: 10, marginBottom: 10 }}><span style={{ fontSize: 14 }}>{ic}</span><span style={{ fontSize: 13, color: MU, lineHeight: 1.6 }}>{t}</span></div>
          ))}
        </Card>
        <Card sx={{ marginBottom: 28, background: TEL, border: `1px solid ${TE}28` }}>
          <h3 style={{ fontFamily: ffH, fontSize: 14, fontWeight: 700, color: TE, marginBottom: 10 }}>Suggested probe questions</h3>
          <ol style={{ paddingLeft: 16, fontSize: 13, color: MU, lineHeight: 2, margin: 0 }}>
            <li>Can you describe your Master's research in your own words?</li>
            <li>Which NLP architectures have you used, and why did you choose them?</li>
            <li>What does the attention mechanism do in a transformer? Explain without jargon.</li>
            <li>If your model results were unexpected, how would you diagnose the issue?</li>
          </ol>
        </Card>
        <Btn ch="Start session" sz="lg" onClick={() => router.push("/judge/meeting")} full />
      </div>
    </PW>
  );
}
