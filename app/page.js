'use client';
import { useRouter } from "next/navigation";
import { Btn, Card } from "@/components/ui";
import { N, TE, TEL, MU, TX, W, KNOWLEDGE, DELTA, ffH } from "@/lib/theme";

export default function Landing() {
  const router = useRouter();
  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: N, color: W, padding: "80px 40px", textAlign: "center" }}>
        <div style={{ fontSize: 60, fontFamily: ffH, fontWeight: 800, color: TE, lineHeight: 1 }}>Δ</div>
        <h1 style={{ fontFamily: ffH, fontSize: 44, fontWeight: 800, margin: "12px 0 8px" }}>PeerProof</h1>
        <p style={{ color: "#94a3b8", fontSize: 19, maxWidth: 520, margin: "0 auto 36px" }}>Academic credentials verified by real graduate students — not paperwork.</p>
        <Btn ch="Request an assessment" sz="lg" onClick={() => router.push("/hr/new")} />
      </div>

      <div style={{ padding: "64px 40px", maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontFamily: ffH, fontSize: 28, fontWeight: 800, color: N }}>Diploma fraud is solvable. Traditional verification isn't enough.</h2>
        <p style={{ color: MU, fontSize: 16, lineHeight: 1.75, marginTop: 16, maxWidth: 640, margin: "16px auto 0" }}>
          Certificates can be faked. Transcripts can be bought. PeerProof uses live peer interviews — conducted by verified graduate students and postdocs in the same field — to give you a real measure of knowledge and professionalism.
        </p>
      </div>

      <div style={{ background: W, padding: "60px 40px" }}>
        <h2 style={{ fontFamily: ffH, fontSize: 24, fontWeight: 800, textAlign: "center", color: N, marginBottom: 36 }}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, maxWidth: 900, margin: "0 auto" }}>
          {[
            ["1", "You submit", "Share the candidate's name, email, degree level, and field. No account needed."],
            ["2", "We match", "A verified grad student or postdoc in the same sub-field is assigned. Both get a private link by email."],
            ["3", "You receive", "A recorded session + structured report with Knowledge Score and Delta Score within 24 hours."],
          ].map(([n, t, b]) => (
            <Card key={n}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: TEL, color: TE, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, marginBottom: 14 }}>{n}</div>
              <h3 style={{ fontFamily: ffH, fontSize: 16, fontWeight: 700, color: N, marginBottom: 8 }}>{t}</h3>
              <p style={{ color: MU, fontSize: 14, lineHeight: 1.65 }}>{b}</p>
            </Card>
          ))}
        </div>
      </div>

      <div style={{ padding: "64px 40px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ fontFamily: ffH, fontSize: 24, fontWeight: 800, textAlign: "center", color: N, marginBottom: 32 }}>Two scores. One clear picture.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <Card>
            <div style={{ fontSize: 44, fontFamily: ffH, fontWeight: 800, color: TE }}>A–D</div>
            <h3 style={{ fontFamily: ffH, fontSize: 17, fontWeight: 700, color: N, margin: "10px 0 8px" }}>Knowledge score</h3>
            <p style={{ color: MU, fontSize: 13, lineHeight: 1.65, marginBottom: 18 }}>How deeply does the candidate actually know their field? Assessed through structured technical questioning by a senior peer.</p>
            {Object.entries(KNOWLEDGE).map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ width: 26, height: 26, borderRadius: 6, background: v.bg, color: v.color, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: ffH }}>{k}</span>
                <span style={{ fontSize: 13, color: MU, lineHeight: 1.5 }}><strong style={{ color: TX }}>{v.label}</strong> — {v.desc}</span>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontSize: 44, fontFamily: ffH, fontWeight: 800, color: N }}>Δ</div>
            <h3 style={{ fontFamily: ffH, fontSize: 17, fontWeight: 700, color: N, margin: "10px 0 8px" }}>Delta score</h3>
            <p style={{ color: MU, fontSize: 13, lineHeight: 1.65, marginBottom: 18 }}>How does actual performance compare to what was claimed on the CV? The key fraud-detection signal.</p>
            {DELTA.map(d => (
              <div key={d.v} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 7 }}>
                <span style={{ minWidth: 34, background: d.bg, color: d.color, fontWeight: 700, fontSize: 12, padding: "2px 6px", borderRadius: 4, fontFamily: ffH, textAlign: "center" }}>{d.v > 0 ? "+" : ""}{d.v}</span>
                <span style={{ fontSize: 12, color: MU }}>{d.desc}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <div style={{ background: N, padding: "56px 40px", textAlign: "center", color: W }}>
        <h2 style={{ fontFamily: ffH, fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Ready to verify a candidate?</h2>
        <p style={{ color: "#94a3b8", marginBottom: 28 }}>No subscription. No account. Pay per assessment.</p>
        <Btn ch="Get started" sz="lg" onClick={() => router.push("/hr/new")} />
      </div>
    </div>
  );
}
