'use client';
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRequireJudge } from "@/lib/useRequireJudge";
import { Btn, Card, PW } from "@/components/ui";
import { N, TE, TEL, MU, TX, BR, RD, RDL, KNOWLEDGE, DELTA, ffH, ff } from "@/lib/theme";

function Content() {
  const router = useRouter();
  const { checking } = useRequireJudge();
  const params = useSearchParams();
  const sessionId = params.get("s");
  const [k, setK] = useState(null);
  const [d, setD] = useState(null);
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const needsNote = d !== null && d <= -2;
  const canSubmit = k !== null && d !== null && (!needsNote || notes.length > 20) && !!sessionId;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSubmitting(false);
      setError("Your session has expired. Please log in again to submit this score.");
      return;
    }
    const res = await fetch("/api/judge-submit-score", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ sessionId, knowledgeScore: k, deltaScore: d, notes }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    setDone(true);
  }

  if (checking) {
    return <PW><div style={{ padding: 60, textAlign: "center", color: MU }}>Checking access…</div></PW>;
  }

  if (done) {
    return (
      <PW>
        <div style={{ maxWidth: 460, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ fontSize: 36, fontFamily: ffH, fontWeight: 800, color: TE, marginBottom: 16 }}>Δ</div>
          <h2 style={{ fontFamily: ffH, fontSize: 26, fontWeight: 800, color: N }}>Assessment submitted</h2>
          <p style={{ color: MU, lineHeight: 1.8, marginTop: 12, fontSize: 14 }}>Thank you. Your honorarium of ¥2,500 will be processed within 3 business days. You may close this window.</p>
          <div style={{ marginTop: 24, background: TEL, borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 13, color: TE, fontWeight: 600 }}>Your identity remains fully anonymous to the candidate and company HR.</p>
          </div>
        </div>
      </PW>
    );
  }

  return (
    <PW>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "36px 24px" }}>
        <h1 style={{ fontFamily: ffH, fontSize: 26, fontWeight: 800, color: N, marginBottom: 6 }}>Score the candidate</h1>
        <p style={{ color: MU, fontSize: 14, marginBottom: 28 }}>Base your assessment only on what you observed during the session.</p>
        {!sessionId && (
          <Card sx={{ marginBottom: 18, background: "#fffbeb", border: "1px solid #fde68a" }}>
            <p style={{ fontSize: 13, color: "#b45309" }}>No session reference found — this page was opened without a session link, so scoring can't be saved. Please return to the meeting and end the call normally to get here.</p>
          </Card>
        )}
        <Card sx={{ marginBottom: 18 }}>
          <h3 style={{ fontFamily: ffH, fontSize: 15, fontWeight: 700, color: N, marginBottom: 16 }}>Knowledge score <span style={{ color: RD }}>*</span></h3>
          {Object.entries(KNOWLEDGE).map(([key, v]) => (
            <div key={key} onClick={() => setK(key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, border: `2px solid ${k === key ? v.color : BR}`, background: k === key ? v.bg : "#fff", cursor: "pointer", marginBottom: 8, transition: "all .12s" }}>
              <span style={{ width: 38, height: 38, borderRadius: 8, background: v.bg, color: v.color, fontWeight: 800, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: ffH }}>{key}</span>
              <div>
                <div style={{ fontWeight: 600, color: TX, fontSize: 14 }}>{v.label}</div>
                <div style={{ fontSize: 12, color: MU, marginTop: 2 }}>{v.desc}</div>
              </div>
            </div>
          ))}
        </Card>
        <Card sx={{ marginBottom: 18 }}>
          <h3 style={{ fontFamily: ffH, fontSize: 15, fontWeight: 700, color: N, marginBottom: 4 }}>Delta score (Δ) <span style={{ color: RD }}>*</span></h3>
          <p style={{ fontSize: 12, color: MU, marginBottom: 14 }}>Compare observed performance against what was claimed on their CV</p>
          {DELTA.map(item => (
            <div key={item.v} onClick={() => setD(item.v)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, borderRadius: 10, border: `2px solid ${d === item.v ? item.color : BR}`, background: d === item.v ? item.bg : "#fff", cursor: "pointer", marginBottom: 7, transition: "all .12s" }}>
              <span style={{ minWidth: 38, background: item.bg, color: item.color, fontWeight: 700, fontSize: 13, padding: "4px 6px", borderRadius: 6, textAlign: "center", fontFamily: ffH }}>{item.v > 0 ? "+" : ""}{item.v}</span>
              <div><div style={{ fontWeight: 600, color: TX, fontSize: 13 }}>{item.label}</div><div style={{ fontSize: 12, color: MU }}>{item.desc}</div></div>
            </div>
          ))}
        </Card>
        <Card sx={{ marginBottom: 28 }}>
          <h3 style={{ fontFamily: ffH, fontSize: 15, fontWeight: 700, color: N, marginBottom: 4 }}>
            Assessment notes {needsNote && <span style={{ color: RD, fontSize: 13 }}>* Required for Δ ≤ −2</span>}
          </h3>
          <p style={{ fontSize: 12, color: MU, marginBottom: 10 }}>Shared with HR, anonymised. Be specific about what you observed.</p>
          {needsNote && <div style={{ background: RDL, borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12, color: RD, fontWeight: 600 }}>⚠ A Δ ≤ −2 score requires written justification before submitting.</div>}
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} placeholder="e.g. Candidate demonstrated awareness of basic ML concepts but was unable to explain transformer architecture in depth…" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${needsNote && notes.length < 20 ? RD : BR}`, fontSize: 13, fontFamily: ff, resize: "vertical", boxSizing: "border-box" }} />
        </Card>
        {error && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ color: RD, fontSize: 13, marginBottom: error.includes("expired") ? 8 : 0 }}>{error}</p>
            {error.includes("expired") && (
              <>
                <Btn ch="Log in again" sz="sm" onClick={() => router.push("/judge/login")} />
                <p style={{ fontSize: 12, color: MU, marginTop: 6 }}>After logging in, click "Join interview" on your dashboard, then end the call again to return here.</p>
              </>
            )}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Btn ch={submitting ? "Submitting…" : "Submit assessment"} sz="lg" v={canSubmit ? "primary" : "ghost"} onClick={submit} />
          {!canSubmit && !submitting && <span style={{ fontSize: 12, color: MU }}>Complete all required fields above</span>}
        </div>
      </div>
    </PW>
  );
}

export default function JudgeScore() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  );
}
