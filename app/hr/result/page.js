'use client';
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRequireCompanyUser } from "@/lib/useRequireCompanyUser";
import { Btn, Badge, Card, PW } from "@/components/ui";
import { N, GR, MU, TX, RD, AM, BL, RDL, KNOWLEDGE, DELTA, ffH, ff } from "@/lib/theme";

function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const { checking } = useRequireCompanyUser();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checking || !id) return;
    async function load() {
      const { data, error } = await supabase
        .from("assessments")
        .select("*, results(*)")
        .eq("id", id)
        .maybeSingle();
      if (!error) setAssessment(data);
      setLoading(false);
    }
    load();
  }, [checking, id]);

  if (checking || loading) {
    return <PW><div style={{ padding: 60, textAlign: "center", color: MU }}>Loading…</div></PW>;
  }

  const result = assessment?.results?.[0];

  if (!assessment || !result) {
    return (
      <PW>
        <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 24px" }}>
          <button onClick={() => router.push("/hr")} style={{ background: "none", border: "none", cursor: "pointer", color: MU, fontSize: 13, marginBottom: 20, fontFamily: ff }}>← Dashboard</button>
          <p style={{ color: MU }}>No result available yet for this assessment.</p>
        </div>
      </PW>
    );
  }

  const k = result.knowledge_score;
  const d = result.delta_score;
  const notes = result.judge_notes;
  const ki = KNOWLEDGE[k];
  const di = DELTA.find(x => x.v === d);
  const pct = ((d + 3) / 6) * 100;

  return (
    <PW>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px" }}>
        <button onClick={() => router.push("/hr")} style={{ background: "none", border: "none", cursor: "pointer", color: MU, fontSize: 13, marginBottom: 20, fontFamily: ff }}>← Dashboard</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: ffH, fontSize: 26, fontWeight: 800, color: N }}>{assessment.candidate_name}</h1>
            <p style={{ color: MU, fontSize: 14, marginTop: 4 }}>{assessment.candidate_field} · {assessment.candidate_degree} · {assessment.candidate_university}</p>
          </div>
          <Badge label="Completed" color={GR} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 600, color: MU, letterSpacing: "0.06em", marginBottom: 14 }}>KNOWLEDGE SCORE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: 12, background: ki.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontFamily: ffH, fontWeight: 800, color: ki.color, flexShrink: 0 }}>{k}</div>
              <div>
                <div style={{ fontWeight: 700, color: ki.color, fontSize: 15 }}>{ki.label}</div>
                <div style={{ fontSize: 13, color: MU, marginTop: 3, lineHeight: 1.5 }}>{ki.desc}</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 600, color: MU, letterSpacing: "0.06em", marginBottom: 14 }}>DELTA SCORE (Δ)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: 12, background: di.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontFamily: ffH, fontWeight: 800, color: di.color, flexShrink: 0 }}>{d > 0 ? "+" : ""}{d}</div>
              <div>
                <div style={{ fontWeight: 700, color: di.color, fontSize: 15 }}>{di.label}</div>
                <div style={{ fontSize: 13, color: MU, marginTop: 3, lineHeight: 1.5 }}>{di.desc}</div>
              </div>
            </div>
          </Card>
        </div>
        <Card sx={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: MU, letterSpacing: "0.06em", marginBottom: 14 }}>DELTA POSITION</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: MU, marginBottom: 8 }}>
            <span>−3 fraud signal</span><span>0 matched</span><span>+3 exceeded</span>
          </div>
          <div style={{ height: 10, background: `linear-gradient(to right, ${RD}, ${AM}, #cbd5e1, ${BL}, ${GR})`, borderRadius: 5, position: "relative" }}>
            <div style={{ position: "absolute", top: -5, width: 20, height: 20, background: di.color, borderRadius: "50%", border: "3px solid white", left: `calc(${pct}% - 10px)`, boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
          </div>
        </Card>
        <Card sx={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: MU, letterSpacing: "0.06em" }}>JUDGE'S ASSESSMENT</div>
            <Badge label="Anonymous" color={N} />
          </div>
          <p style={{ fontSize: 14, color: TX, lineHeight: 1.8 }}>{notes}</p>
        </Card>
        {d <= -2 && (
          <div style={{ background: RDL, border: `1px solid ${RD}28`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <p style={{ fontWeight: 700, color: RD, fontSize: 14, marginBottom: 4 }}>⚠ Fraud signal detected</p>
            <p style={{ fontSize: 13, color: MU, lineHeight: 1.65 }}>The delta score indicates a significant gap between claimed qualifications and demonstrated knowledge. We recommend additional verification before proceeding with this candidate.</p>
          </div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <Btn ch="Download report (PDF)" />
          <Btn ch="Request re-evaluation" v="ghost" />
        </div>
      </div>
    </PW>
  );
}

export default function HRResult() {
  return (
    <Suspense fallback={null}>
      <ResultContent />
    </Suspense>
  );
}
