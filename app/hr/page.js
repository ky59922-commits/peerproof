'use client';
import { useRouter } from "next/navigation";
import { Btn, Badge, Card, Stat, PW, TopBar } from "@/components/ui";
import { N, BL, GR, RD, MU, BR, ASSESSMENTS, STC, STL, ffH } from "@/lib/theme";

export default function HRDash() {
  const router = useRouter();
  const done = ASSESSMENTS.filter(a => a.status === "completed").length;
  const prog = ASSESSMENTS.filter(a => a.status === "in_progress").length;
  const flags = ASSESSMENTS.filter(a => a.result?.d <= -2).length;

  return (
    <PW>
      <TopBar label="COMPANY PORTAL" sub="Asahi Holdings HR" action={<Btn ch="+ New assessment" onClick={() => router.push("/hr/new")} />} />
      <div style={{ padding: "28px 36px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <Stat label="Total assessments" val={ASSESSMENTS.length} color={N} />
        <Stat label="In progress" val={prog} color={BL} />
        <Stat label="Completed" val={done} color={GR} />
        <Stat label="Fraud signals (Δ ≤ −2)" val={flags} color={RD} />
      </div>
      <div style={{ padding: "0 36px 36px" }}>
        <Card>
          <h2 style={{ fontFamily: ffH, fontSize: 17, fontWeight: 700, color: N, marginBottom: 20 }}>Assessments</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${BR}` }}>
                {["ID", "Candidate", "Field", "Degree", "Status", "Date", "Result"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: MU, fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASSESSMENTS.map(a => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${BR}` }}>
                  <td style={{ padding: "14px 12px", color: MU, fontSize: 12 }}>{a.id}</td>
                  <td style={{ padding: "14px 12px", fontWeight: 600 }}>{a.candidate.name}</td>
                  <td style={{ padding: "14px 12px", color: MU, fontSize: 13 }}>{a.candidate.field}</td>
                  <td style={{ padding: "14px 12px" }}><Badge label={a.candidate.degree} color={N} /></td>
                  <td style={{ padding: "14px 12px" }}><Badge label={STL[a.status]} color={STC[a.status]} /></td>
                  <td style={{ padding: "14px 12px", color: MU, fontSize: 13 }}>{a.created}</td>
                  <td style={{ padding: "14px 12px" }}>
                    {a.result
                      ? <Btn ch="View result" sz="sm" onClick={() => router.push(`/hr/result?id=${a.id}`)} />
                      : <span style={{ color: MU, fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </PW>
  );
}
