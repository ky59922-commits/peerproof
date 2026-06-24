'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRequireJudge } from "@/lib/useRequireJudge";
import { Btn, Badge, Card, Stat, PW, TopBar } from "@/components/ui";
import { LanguageSummary } from "@/components/LanguagePicker";
import { FocusDisplay, hasFocus } from "@/components/Focus";
import { N, GR, TE, TEL, MU, BR, RD, ffH } from "@/lib/theme";

export default function JudgeDashboard() {
  const router = useRouter();
  const { checking, judge } = useRequireJudge();
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState("");
  const [acceptingId, setAcceptingId] = useState(null);

  async function loadQueue() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/judge/login");
      return;
    }
    const res = await fetch("/api/judge-queue", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        router.push("/judge/login");
        return;
      }
      setError(data.error || "Could not load your queue. Try refreshing.");
      setQueue({ busy: false, requests: [] });
      return;
    }
    setQueue(data);
  }

  useEffect(() => { if (!checking) loadQueue(); }, [checking]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/judge/login");
  }

  async function accept(assessmentId, slotId) {
    setAcceptingId(slotId);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/judge-accept", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ assessmentId, slotId }),
    });
    const data = await res.json();
    setAcceptingId(null);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      loadQueue();
      return;
    }
    loadQueue();
  }

  if (checking || queue === null) {
    return <PW><div style={{ padding: 60, textAlign: "center", color: MU }}>Checking access…</div></PW>;
  }

  const fmtSlot = t => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <PW>
      <TopBar
        label="JUDGE PORTAL"
        sub={`Judge ${judge.code}`}
        action={<Btn ch="Log out" v="ghost" onClick={logout} />}
      />
      <div style={{ padding: "28px 36px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <Stat label="Sessions completed" val={judge.sessions_completed ?? 0} color={N} />
        <Stat label="Rating" val={judge.rating ? `★ ${judge.rating}` : "—"} color={GR} />
        <Stat label="Field" val={judge.field} color={TE} />
      </div>
      <div style={{ padding: "0 36px 36px" }}>
        {queue.busy ? (
          <Card sx={{ background: TEL, border: `1px solid ${TE}44` }}>
            <h2 style={{ fontFamily: ffH, fontSize: 17, fontWeight: 700, color: N, marginBottom: 16 }}>Your upcoming session</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: MU, marginBottom: 2 }}>Scheduled for</div>
                <div style={{ fontWeight: 700, color: N, fontSize: 15 }}>
                  {queue.activeSession?.scheduledAt ? fmtSlot(queue.activeSession.scheduledAt) : "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: MU, marginBottom: 2 }}>Candidate</div>
                <div style={{ fontWeight: 700, color: N, fontSize: 15 }}>
                  {queue.activeSession?.candidateDegree} · {queue.activeSession?.candidateField}
                </div>
              </div>
            </div>
            {hasFocus(queue.activeSession?.focus) && (
              <div style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: N, marginBottom: 6 }}>What HR wants you to focus on</div>
                <FocusDisplay focus={queue.activeSession.focus} />
              </div>
            )}
            <Btn ch="Join interview" sz="lg" onClick={() => router.push(`/judge/meeting?s=${queue.activeSession.sessionId}`)} />
            <p style={{ fontSize: 12, color: MU, lineHeight: 1.7, marginTop: 12, marginBottom: 0 }}>
              You can join the call directly from here. New requests will reappear in your queue once this session is scored.
            </p>
          </Card>
        ) : (
          <Card>
            <h2 style={{ fontFamily: ffH, fontSize: 17, fontWeight: 700, color: N, marginBottom: 4 }}>Open requests in your field</h2>
            <p style={{ fontSize: 13, color: MU, marginBottom: 16 }}>Accept any time slot that works for you. First to accept locks it in — you can only hold one active session at a time.</p>
            {error && <p style={{ color: RD, fontSize: 13, marginBottom: 14 }}>{error}</p>}
            {queue.requests.length === 0 ? (
              <p style={{ color: MU, fontSize: 14 }}>No open requests right now. Check back later.</p>
            ) : (
              queue.requests.map(req => (
                <div key={req.id} style={{ borderBottom: `1px solid ${BR}`, padding: "14px 0" }}>
                  <div style={{ marginBottom: 8 }}>
                    <Badge label={req.candidate_degree} color={N} />
                    <span style={{ fontSize: 13, color: MU, marginLeft: 8 }}>{req.candidate_field}</span>
                  </div>
                  {req.languages && req.languages.length > 0 && (
                    <div style={{ marginBottom: 8, fontSize: 12, color: MU }}>
                      🗣 Languages: <LanguageSummary languages={req.languages} />
                    </div>
                  )}
                  {hasFocus(req.focus) && (
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: N, marginBottom: 6 }}>What HR wants you to focus on</div>
                      <FocusDisplay focus={req.focus} />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(req.proposed_slots || []).map(slot => (
                      <Btn
                        key={slot.id}
                        sz="sm"
                        v="ghost"
                        ch={acceptingId === slot.id ? "Accepting…" : fmtSlot(slot.slot_time)}
                        onClick={() => accept(req.id, slot.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </Card>
        )}
      </div>
    </PW>
  );
}
