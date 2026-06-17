'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRequireCompanyUser } from "@/lib/useRequireCompanyUser";
import { Btn, Badge, Card, Stat, PW, TopBar } from "@/components/ui";
import { N, BL, GR, RD, MU, BR, STC, STL, ffH } from "@/lib/theme";

export default function HRDash() {
  const router = useRouter();
  const { checking, user } = useRequireCompanyUser();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (checking) return;
    async function load() {
      const { data, error } = await supabase
        .from("assessments")
        .select("*, results(*), sessions(id, scheduled_at)")
        .order("created_at", { ascending: false });
      if (!error) setAssessments(data || []);
      setLoading(false);
    }
    load();
  }, [checking]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/hr/login");
  }

  async function copyLink(sessionId, assessmentId) {
    const link = `${window.location.origin}/candidate?s=${sessionId}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(assessmentId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (checking) {
    return <PW><div style={{ padding: 60, textAlign: "center", color: MU }}>Checking access…</div></PW>;
  }

  const done = assessments.filter(a => a.status === "completed").length;
  const prog = assessments.filter(a => a.status === "in_progress").length;
  const flags = assessments.filter(a => (a.results?.[0]?.delta_score ?? 0) <= -2).length;

  const fmtSlot = t => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <PW>
      <TopBar
        label="COMPANY PORTAL"
        sub={user?.companyName || "Your company"}
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Btn ch="+ New assessment" onClick={() => router.push("/hr/new")} />
            <Btn ch="Log out" v="ghost" onClick={logout} />
          </div>
        }
      />
      <div style={{ padding: "28px 36px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <Stat label="Total assessments" val={assessments.length} color={N} />
        <Stat label="In progress" val={prog} color={BL} />
        <Stat label="Completed" val={done} color={GR} />
        <Stat label="Fraud signals (Δ ≤ −2)" val={flags} color={RD} />
      </div>
      <div style={{ padding: "0 36px 36px" }}>
        <Card>
          <h2 style={{ fontFamily: ffH, fontSize: 17, fontWeight: 700, color: N, marginBottom: 20 }}>Assessments</h2>
          {loading ? (
            <p style={{ color: MU, fontSize: 14 }}>Loading…</p>
          ) : assessments.length === 0 ? (
            <p style={{ color: MU, fontSize: 14 }}>No assessments yet. Click "+ New assessment" to get started.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${BR}` }}>
                  {["Candidate", "Field", "Degree", "Status", "Requested", "Scheduled", "Result"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: MU, fontSize: 12, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assessments.map(a => {
                  const result = a.results?.[0];
                  const scheduledAt = a.sessions?.[0]?.scheduled_at;
                  const sessionId = a.sessions?.[0]?.id;
                  return (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${BR}` }}>
                      <td style={{ padding: "14px 12px", fontWeight: 600 }}>{a.candidate_name}</td>
                      <td style={{ padding: "14px 12px", color: MU, fontSize: 13 }}>{a.candidate_field}</td>
                      <td style={{ padding: "14px 12px" }}><Badge label={a.candidate_degree} color={N} /></td>
                      <td style={{ padding: "14px 12px" }}><Badge label={STL[a.status] || a.status} color={STC[a.status] || MU} /></td>
                      <td style={{ padding: "14px 12px", color: MU, fontSize: 13 }}>{new Date(a.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "14px 12px", color: MU, fontSize: 13 }}>
                        {scheduledAt ? (
                          <>
                            <div>{fmtSlot(scheduledAt)}</div>
                            {sessionId && (
                              <button onClick={() => copyLink(sessionId, a.id)} style={{ background: "none", border: "none", color: "#2a9d8f", fontSize: 11, cursor: "pointer", padding: 0, marginTop: 2 }}>
                                {copiedId === a.id ? "Copied!" : "Copy candidate link"}
                              </button>
                            )}
                          </>
                        ) : <span style={{ color: MU }}>Awaiting judge</span>}
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        {result ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontFamily: ffH, fontWeight: 800, fontSize: 18, lineHeight: 1, color: result.delta_score <= -2 ? RD : GR, position: "relative", display: "inline-block" }}>
                              {result.knowledge_score}
                              <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 1, position: "relative", top: "-0.6em" }}>{result.delta_score > 0 ? "+" : ""}{result.delta_score}</span>
                            </span>
                            <Btn ch="Details" sz="sm" onClick={() => router.push(`/hr/result?id=${a.id}`)} />
                          </div>
                        ) : (
                          <span style={{ color: MU, fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </PW>
  );
}
