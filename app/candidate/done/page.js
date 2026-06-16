import { Card, PW } from "@/components/ui";
import { N, TE, TEL, MU, ffH } from "@/lib/theme";

export default function CandDone() {
  return (
    <PW>
      <div style={{ maxWidth: 460, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>✓</div>
        <h2 style={{ fontFamily: ffH, fontSize: 26, fontWeight: 800, color: N }}>Session complete</h2>
        <p style={{ color: MU, lineHeight: 1.8, marginTop: 12, fontSize: 14 }}>Thank you. Your results will be sent to the company HR within 24 hours. You may close this window.</p>
        <div style={{ marginTop: 24, background: TEL, borderRadius: 10, padding: 14 }}>
          <p style={{ fontSize: 13, color: MU, lineHeight: 1.65 }}><strong style={{ color: TE }}>Your privacy:</strong> The company receives a structured report only. Your contact details remain with PeerProof.</p>
        </div>
      </div>
    </PW>
  );
}
