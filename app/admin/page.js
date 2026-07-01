'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRequireAdmin } from "@/lib/useRequireAdmin";
import { Btn, Badge, Card, Stat, PW, TopBar } from "@/components/ui";
import { LanguageSummary } from "@/components/LanguagePicker";
import { ExperienceSummary } from "@/components/CandidateInfo";
import { FocusDisplay, hasFocus } from "@/components/Focus";
import { N, AM, BL, GR, RD, TEL, TE, MU, BR, STC, STL, ffH } from "@/lib/theme";

export default function Admin() {
  const router = useRouter();
  const { checking, adminName } = useRequireAdmin();
  const [assessments, setAssessments] = useState([]);
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState(null);
  const [expanded, setExpanded] = useState(new Set());

  async function loadData() {
    setLoading(true);
    const [{ data: assessmentsData }, { data: judgesData }] = await Promise.all([
      supabase
        .from("assessments")
        .select("*, results(*), companies(name), company_users(name), sessions(scheduled_at, ended_at, round, judges(name, code))")
        .order("created_at", { ascending: false }),
      supabase.from("judges").select("*").order("sessions_completed", { ascending: false }),
    ]);
    setAssessments(assessmentsData || []);
    setJudges(judgesData || []);
    setLoading(false);
  }

  useEffect(() => { if (!checking) loadData(); }, [checking]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  async function releaseAssessment(assessment) {
    if (!window.confirm(`Release "${assessment.candidate_name}" back to the open pool? This removes the current match (and any session tied to it) so any eligible judge can accept it again.`)) {
      return;
    }
    setReleasingId(assessment.id);
    // Only remove the session for the round currently in progress, so an earlier
    // completed round's session and result stay intact.
    const currentRound = assessment.current_round || 1;
    await supabase.from("sessions").delete().eq("assessment_id", assessment.id).eq("round", currentRound);
    const { error } = await supabase.from("assessments").update({ status: "pending" }).eq("id", assessment.id);
    setReleasingId(null);
    if (error) {
      alert("Failed to release: " + error.message);
      return;
    }
    loadData();
  }

  function toggleCompany(companyId) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId); else next.add(companyId);
      return next;
    });
  }

  if (checking) {
    return <PW><div style={{ padding: 60, textAlign: "center", color: MU }}>Checking access…</div></PW>;
  }

  const total = assessments.length;
  const pending = assessments.filter(a => a.status === "pending").length;
  const inProgress = assessments.filter(a => a.status === "in_progress").length;
  const completed = assessments.filter(a => a.status === "completed").length;
  const fraudSignals = assessments.filter(a => (a.results || []).some(r => (r.delta_score ?? 0) <= -2)).length;

  // Group assessments by company, preserving most-recent-activity order
  const companyMap = new Map();
  for (const a of assessments) {
    const cid = a.company_id;
    if (!companyMap.has(cid)) {
      companyMap.set(cid, { companyName: a.companies?.name || "Unknown company", items: [] });
    }
    companyMap.get(cid).items.push(a);
  }
  const companyGroups = Array.from(companyMap.entries()).map(([companyId, g]) => ({
    companyId,
    companyName: g.companyName,
    items: g.items,
    total: g.items.length,
    pending: g.items.filter(a => a.status === "pending").length,
    inProgress: g.items.filter(a => a.status === "in_progress").length,
    completed: g.items.filter(a => a.status === "completed").length,
  }));

  const fmtSlot = t => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return (
    <PW>
      <TopBar
        label="PLATFORM ADMIN"
        sub={`Operations dashboard${adminName ? ` — ${adminName}` : ""}`}
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Btn ch="Company Applications" onClick={() => router.push("/admin/applications")} />
            <Btn ch="Judge Applications" onClick={() => router.push("/admin/judge-applications")} />
            <Btn ch="Log out" v="ghost" onClick={logout} />
          </div>
        }
      />
      <div style={{ padding: "24px 36px", display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 8 }}>
        <Stat label="Total assessments" val={total} color={N} />
        <Stat label="Pending" val={pending} color={AM} />
        <Stat label="In progress" val={inProgress} color={BL} />
        <Stat label="Completed" val={completed} color={GR} />
        <Stat label="Fraud signals" val={fraudSignals} color={RD} />
      </div>
      <div style={{ padding: "16px 36px 36px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <Card>
          <h2 style={{ fontFamily: ffH, fontSize: 16, fontWeight: 700, color: N, marginBottom: 16 }}>Assessments by company</h2>
          {loading ? (
            <p style={{ color: MU, fontSize: 14 }}>Loading…</p>
          ) : companyGroups.length === 0 ? (
            <p style={{ color: MU, fontSize: 14 }}>No assessments yet.</p>
          ) : (
            <div style={{ maxHeight: 560, overflowY: "auto" }}>
              {companyGroups.map(g => (
                <div key={g.companyId} style={{ borderBottom: `1px solid ${BR}` }}>
                  <div
                    onClick={() => toggleCompany(g.companyId)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Badge label={g.companyName} color={N} />
                      <span style={{ fontSize: 12, color: MU }}>{g.total} total</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: MU }}>{g.pending} pending · {g.inProgress} in progress · {g.completed} completed</span>
                      <span style={{ fontSize: 12, color: TE }}>{expanded.has(g.companyId) ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {expanded.has(g.companyId) && (
                    <div style={{ paddingBottom: 10 }}>
                      {g.items.map(a => {
                        const sortedResults = (a.results || []).slice().sort((x, y) => (x.round || 1) - (y.round || 1));
                        const sortedSessions = (a.sessions || []).slice().sort((x, y) => (x.round || 1) - (y.round || 1));
                        const hrName = a.company_users?.name;
                        const isSecondRound = (a.current_round || 1) > 1;
                        const statusLabel = a.status === "cancelled"
                          ? "Cancelled"
                          : (isSecondRound && (a.status === "pending" || a.status === "in_progress"))
                            ? `2nd opinion (${STL[a.status] || a.status})`
                            : (STL[a.status] || a.status);
                        const statusColor = a.status === "cancelled" ? MU : (isSecondRound ? AM : (STC[a.status] || MU));
                        function judgeForRound(round) {
                          const s = sortedSessions.find(x => (x.round || 1) === round);
                          return s?.judges ? `${s.judges.name || "Judge"} (${s.judges.code})` : null;
                        }
                        return (
                          <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0 10px 14px", borderTop: `1px solid ${BR}`, gap: 10, opacity: a.status === "cancelled" ? 0.6 : 1 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.candidate_name}</div>
                              <div style={{ fontSize: 12, color: MU }}>{a.candidate_field} · {a.candidate_degree}{a.candidate_nationality ? ` · ${a.candidate_nationality}` : ""}</div>
                              {a.work_experience && a.work_experience.length > 0 && (
                                <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>💼 <ExperienceSummary experience={a.work_experience} /></div>
                              )}
                              {a.languages && a.languages.length > 0 && (
                                <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>🗣 <LanguageSummary languages={a.languages} /></div>
                              )}
                              <div style={{ fontSize: 12, color: MU, marginTop: 2 }}>HR: {hrName || "—"}</div>
                              {sortedSessions.length === 0 && a.status === "pending" && (
                                <div style={{ fontSize: 12, color: MU, marginTop: 2 }}>Judge: Not yet matched</div>
                              )}
                              {sortedSessions.map(s => (
                                <div key={s.round} style={{ fontSize: 12, color: MU, marginTop: 2 }}>
                                  {(a.current_round || 1) > 1 || (s.round || 1) > 1 ? `Round ${s.round || 1} — ` : ""}Judge: {judgeForRound(s.round || 1) || "—"}
                                  {s.scheduled_at ? ` · ${fmtSlot(s.scheduled_at)}` : ""}
                                </div>
                              ))}
                              <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>Created {fmtSlot(a.created_at)}</div>
                              {hasFocus(a.focus) && (
                                <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${BR}` }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: MU, marginBottom: 4 }}>FOCUS REQUESTED</div>
                                  <FocusDisplay focus={a.focus} />
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 180 }}>
                              <Badge label={statusLabel} color={statusColor} />
                              {sortedResults.map(result => (
                                <span key={result.id} title={`Round ${result.round || 1}`} style={{ fontFamily: ffH, fontWeight: 800, fontSize: 16, lineHeight: 1, color: result.delta_score <= -2 ? RD : GR, position: "relative", display: "inline-block" }}>
                                  {result.knowledge_score}
                                  <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 1, position: "relative", top: "-0.6em" }}>{result.delta_score > 0 ? "+" : ""}{result.delta_score}</span>
                                </span>
                              ))}
                              {a.status === "in_progress" && (
                                <Btn
                                  ch={releasingId === a.id ? "Releasing…" : "Release"}
                                  v="ghost"
                                  sz="sm"
                                  onClick={() => releaseAssessment(a)}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h2 style={{ fontFamily: ffH, fontSize: 16, fontWeight: 700, color: N, marginBottom: 16 }}>Judge pool</h2>
          {loading ? (
            <p style={{ color: MU, fontSize: 14 }}>Loading…</p>
          ) : judges.length === 0 ? (
            <p style={{ color: MU, fontSize: 14 }}>No approved judges yet.</p>
          ) : (
            <div style={{ maxHeight: 480, overflowY: "auto" }}>
              {judges.map(j => (
                <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BR}` }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: TEL, color: TE, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{j.code}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{j.name || `Judge ${j.code}`} <span style={{ color: MU, fontWeight: 400 }}>({j.code})</span></div>
                      <div style={{ fontSize: 12, color: MU }}>{j.field} · {j.level}</div>
                      {j.languages && j.languages.length > 0 && (
                        <div style={{ fontSize: 11, color: MU, marginTop: 1 }}>🗣 <LanguageSummary languages={j.languages} /></div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: GR }}>{j.rating ? `★ ${j.rating}` : "—"}</div>
                    <div style={{ fontSize: 12, color: MU }}>{j.sessions_completed ?? 0} sessions</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 14 }}><Btn ch="Review judge applications" v="ghost" sz="sm" onClick={() => router.push("/admin/judge-applications")} /></div>
        </Card>
      </div>
    </PW>
  );
}
