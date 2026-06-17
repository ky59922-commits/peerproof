'use client';
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Btn, Card, PW } from "@/components/ui";
import { N, TE, TEL, MU, TX, ffH } from "@/lib/theme";

function Content() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("s");

  return (
    <PW>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "56px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 40, fontFamily: ffH, fontWeight: 800, color: TE }}>Δ</div>
        <h1 style={{ fontFamily: ffH, fontSize: 28, fontWeight: 800, color: N, margin: "10px 0 4px" }}>PeerProof</h1>
        <p style={{ color: MU, fontSize: 13, marginBottom: 36 }}>Academic peer verification</p>
        <Card sx={{ textAlign: "left", marginBottom: 20 }}>
          <h2 style={{ fontFamily: ffH, fontSize: 17, fontWeight: 700, color: N, marginBottom: 18 }}>You've been invited to a verification session</h2>
          {[
            ["🎓", "What is this?", "A company you've applied to has requested a short academic peer interview to verify your background and expertise."],
            ["🕐", "How long?", "20–30 minutes. You'll speak with a graduate student or postdoc in your field."],
            ["🔒", "Privacy", "Your interviewer is anonymous to you. The session is recorded and shared only with the requesting company HR and PeerProof staff."],
            ["📋", "What to expect", "A focused academic conversation about your claimed background. Be prepared to discuss your research, methodology, and field knowledge."],
          ].map(([ic, t, b]) => (
            <div key={t} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 16, marginTop: 1 }}>{ic}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: TX }}>{t}</div>
                <div style={{ fontSize: 13, color: MU, marginTop: 3, lineHeight: 1.6 }}>{b}</div>
              </div>
            </div>
          ))}
        </Card>
        {!sessionId && (
          <p style={{ fontSize: 13, color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: 10, marginBottom: 16, textAlign: "left" }}>
            This link is missing a session reference. Please use the exact link sent to you by the company — copying just part of it won't work.
          </p>
        )}
        <p style={{ fontSize: 12, color: MU, lineHeight: 1.7, marginBottom: 20 }}>By clicking "Join session" you consent to recording and its transmission to the requesting company's HR department.</p>
        <Btn
          ch="Join session"
          sz="lg"
          full
          onClick={() => router.push(sessionId ? `/candidate/meeting?s=${sessionId}` : "/candidate/meeting")}
        />
      </div>
    </PW>
  );
}

export default function CandWelcome() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  );
}
