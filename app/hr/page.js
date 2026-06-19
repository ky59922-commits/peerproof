'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRequireCompanyUser } from "@/lib/useRequireCompanyUser";
import { Btn, Badge, Card, Stat, PW, TopBar } from "@/components/ui";
import { N, BL, GR, RD, AM, MU, BR, STC, STL, ffH } from "@/lib/theme";

export default function HRDash() {
  const router = useRouter();
  const { checking, user } = useRequireCompanyUser();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("assessments")
      .select("*, results(*), sessions(id, scheduled_at, round)")
      .order("created_at", { ascending: false });
    if (!error) setAssessments(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (checking) return;
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

  async function doAction(endpoint, assessmentId) {
    setBusyId(assessmentId);
    setActionError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setBusyId(null);
      setActionError("Your session has expired. Please log in again.");
      return;
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ assessmentId }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setActionError(data.error || "Action failed.");
      return;
    }
    await load();
  }

  function cancelAssessment(assessmentId) {
    if (!window.confirm("Cancel this assessment? It will be hidden from judges but kept in your history, and you can reopen it later.")) return;
    doAction("/api/cancel-assessment", assessmentId);
  }

  function reopenAssessment(assessmentId) {
    doAction("/api/reopen-assessment", assessmentId);
  }

  if (checking) {
    return <PW><div style={{ padding: 60, textAlign: "center", color: MU }}>Checking access…</div></PW>;
  }

  const done = assessments.filter(a => a.status === "completed").length;
  const prog = assessments.filter(a => a.status === "in_progress").length;
  const flags = assessments.filter(a => (a.results || []).some(r => (r.delta_score ?? 0) <= -2)).length;

  const fmtSlot = t => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  // For an assessment, get the latest session (highest round) for scheduling/link display
  function latestSession(a) {
    const sessions = a.sessions || [];
    if (sessions.length === 0) return null;
    return sessions.slice().sort((x, y) => (y.round || 1) - (x.round || 1))[0];
  }

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
          {actionError && <p style={{ color: RD, fontSize: 13, marginBottom: 14 }}>{actionError}</p>}
          {loading ? (
            <p style={{ color: MU, fontSize: 14 }}>Loading…</p>
          ) : assessments.length === 0 ? (
            <p style={{ color: MU, fontSize: 14 }}>No assessments yet. Click "+ New assessment" to get started.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${BR}` }}>
                  {["Candidate", "Field", "Degree", "Status", "Requested", "Scheduled", "Result", "Actions"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: MU, fontSize: 12, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assessments.map(a => {
                  const sess = latestSession(a);
                  const scheduledAt = sess?.scheduled_at;
                  const sessionId = sess?.id;
                  const isSecondRound = (a.current_round || 1) > 1;
                  const statusLabel = a.status === "cancelled"
                    ? "Cancelled"
                    : (isSecondRound && (a.status === "pending" || a.status === "in_progress"))
                      ? `2nd opinion (${STL[a.status] || a.status})`
                      : (STL[a.status] || a.status);
                  const statusColor = a.status === "cancelled" ? MU : (isSecondRound ? AM : (STC[a.status] || MU));
                  return (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${BR}`, opacity: a.status === "cancelled" ? 0.6 : 1 }}>
                      <td style={{ padding: "14px 12px", fontWeight: 600 }}>{a.candidate_name}</td>
                      <td style={{ padding: "14px 12px", color: MU, fontSize: 13 }}>{a.candidate_field}</td>
                      <td style={{ padding: "14px 12px" }}><Badge label={a.candidate_degree} color={N} /></td>
                      <td style={{ padding: "14px 12px" }}><Badge label={statusLabel} color={statusColor} /></td>
                      <td style={{ padding: "14px 12px", color: MU, fontSize: 13 }}>{new Date(a.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "14px 12px", color: MU, fontSize: 13 }}>
                        {scheduledAt ? (
                          <>
                            <div>{fmtSlot(scheduledAt)}</div>
                            {sessionId && a.status !== "completed" && (
                              <button onClick={() => copyLink(sessionId, a.id)} style={{ background: "none", border: "none", color: "#2a9d8f", fontSize: 11, cursor: "pointer", padding: 0, marginTop: 2 }}>
                                {copiedId === a.id ? "Copied!" : "Copy candidate link"}
                              </button>
                            )}
                          </>
                        ) : a.status === "cancelled" ? <span style={{ color: MU }}>—</span> : <span style={{ color: MU }}>Awaiting judge</span>}
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        {(a.results || []).length > 0 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {(a.results || []).slice().sort((x, y) => (x.round || 1) - (y.round || 1)).map((r, idx, arr) => (
                                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <span title={arr.length > 1 ? `Round ${r.round || 1}` : undefined} style={{ fontFamily: ffH, fontWeight: 800, fontSize: 20, lineHeight: 1, color: r.delta_score <= -2 ? RD : GR, position: "relative", display: "inline-block" }}>
                                    {r.knowledge_score}
                                    <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 1, position: "relative", top: "-0.6em" }}>{r.delta_score > 0 ? "+" : ""}{r.delta_score}</span>
                                  </span>
                                  {idx < arr.length - 1 && <span style={{ color: BR, fontSize: 14 }}>/</span>}
                                </div>
                              ))}
                            </div>
                            <button onClick={() => router.push(`/hr/result?id=${a.id}`)} style={{ background: "none", border: "none", color: MU, fontSize: 11, cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                              details
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: MU, fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        {a.status === "pending" && (
                          <Btn ch={busyId === a.id ? "…" : "Cancel"} sz="sm" v="ghost" onClick={() => cancelAssessment(a.id)} />
                        )}
                        {a.status === "cancelled" && (
                          <Btn ch={busyId === a.id ? "…" : "Reopen"} sz="sm" v="ghost" onClick={() => reopenAssessment(a.id)} />
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
