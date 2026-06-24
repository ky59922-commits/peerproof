'use client';
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import jsPDF from "jspdf";
import { supabase } from "@/lib/supabase";
import { useRequireCompanyUser } from "@/lib/useRequireCompanyUser";
import { Btn, Badge, Card, PW } from "@/components/ui";
import { LanguageSummary } from "@/components/LanguagePicker";
import { N, GR, MU, TX, RD, AM, BL, TE, TEL, RDL, BR, KNOWLEDGE, DELTA, ffH, ff } from "@/lib/theme";

function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const { checking } = useRequireCompanyUser();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transcriptStatus, setTranscriptStatus] = useState({}); // keyed by round: idle | generating | failed
  const [transcriptError, setTranscriptError] = useState("");
  const [showSlots, setShowSlots] = useState(false);
  const [slots, setSlots] = useState({ slot1: "", slot2: "", slot3: "" });
  const [requesting, setRequesting] = useState(false);
  const [actionError, setActionError] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("assessments")
      .select("*, results(*), sessions(round, judges(name, code))")
      .eq("id", id)
      .maybeSingle();
    if (!error) setAssessment(data);
    setLoading(false);
  }

  useEffect(() => {
    if (checking || !id) return;
    load();
  }, [checking, id]);

  if (checking || loading) {
    return <PW><div style={{ padding: 60, textAlign: "center", color: MU }}>Loading…</div></PW>;
  }

  const results = (assessment?.results || []).slice().sort((a, b) => (a.round || 1) - (b.round || 1));

  if (!assessment || results.length === 0) {
    return (
      <PW>
        <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 24px" }}>
          <button onClick={() => router.push("/hr")} style={{ background: "none", border: "none", cursor: "pointer", color: MU, fontSize: 13, marginBottom: 20, fontFamily: ff }}>← Dashboard</button>
          <p style={{ color: MU }}>No result available yet for this assessment.</p>
        </div>
      </PW>
    );
  }

  const isPendingSecondRound = assessment.status === "pending" && assessment.current_round > 1;
  const isInProgressSecondRound = assessment.status === "in_progress" && assessment.current_round > 1;
  const canRequestSecondOpinion = assessment.status === "completed";

  function judgeForRound(round) {
    const s = (assessment.sessions || []).find(x => (x.round || 1) === round);
    return s?.judges ? `${s.judges.name || "Judge"} (${s.judges.code})` : null;
  }

  async function generateTranscript(round, resultId) {
    setTranscriptStatus(prev => ({ ...prev, [round]: "generating" }));
    setTranscriptError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setTranscriptStatus(prev => ({ ...prev, [round]: "failed" }));
      setTranscriptError("Your session has expired. Please log in again.");
      return;
    }
    const res = await fetch("/api/generate-transcript", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ assessmentId: assessment.id, round }),
    });
    const data = await res.json();
    if (!res.ok) {
      setTranscriptStatus(prev => ({ ...prev, [round]: "failed" }));
      setTranscriptError(data.error || "Failed to generate transcript.");
      return;
    }
    setTranscriptStatus(prev => ({ ...prev, [round]: "idle" }));
    await load();
  }

  function reportFailure(round) {
    alert("Once email notifications are set up, this will automatically notify the PeerProof team. For now, please follow up manually if needed.");
    setTranscriptStatus(prev => ({ ...prev, [round]: "idle" }));
    setTranscriptError("");
  }

  async function requestSecondOpinion() {
    const chosen = [slots.slot1, slots.slot2, slots.slot3].filter(Boolean);
    if (chosen.length === 0) {
      setActionError("Please provide at least one time the candidate is available.");
      return;
    }
    setRequesting(true);
    setActionError("");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/request-second-opinion", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ assessmentId: assessment.id, slots: chosen }),
    });
    const data = await res.json();
    setRequesting(false);
    if (!res.ok) {
      setActionError(data.error || "Failed to request second opinion.");
      return;
    }
    setShowSlots(false);
    setSlots({ slot1: "", slot2: "", slot3: "" });
    await load();
  }

  function downloadPDF() {
    const doc = new jsPDF();
    const marginX = 20;
    const pageWidth = 170;
    const pageBottom = 280;
    let y = 20;

    function ensureSpace(needed) {
      if (y + needed > pageBottom) { doc.addPage(); y = 20; }
    }
    function renderWrapped(lines, lineHeight) {
      for (const line of lines) { ensureSpace(lineHeight); doc.text(line, marginX, y); y += lineHeight; }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PeerProof Verification Report", marginX, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, marginX, y);
    y += 14;

    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(assessment.candidate_name, marginX, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`${assessment.candidate_field} · ${assessment.candidate_degree}${assessment.candidate_university ? " · " + assessment.candidate_university : ""}`, marginX, y);
    y += 7;
    if (assessment.languages && assessment.languages.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(80);
      const langStr = "Languages: " + assessment.languages.map(l => `${l.language} (${l.level})`).join(", ");
      const langLines = doc.splitTextToSize(langStr, pageWidth);
      doc.text(langLines, marginX, y);
      y += langLines.length * 5;
      doc.setTextColor(0);
    }
    y += 7;

    results.forEach((result, idx) => {
      const k = result.knowledge_score;
      const d = result.delta_score;
      const ki = KNOWLEDGE[k];
      const di = DELTA.find(x => x.v === d);

      ensureSpace(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(0);
      const roundLabel = results.length > 1 ? `Round ${result.round || idx + 1}${(result.round || idx + 1) > 1 ? " — Second Opinion" : ""}` : "Assessment Result";
      doc.text(roundLabel, marginX, y);
      y += 9;

      doc.setFontSize(11);
      doc.text("Knowledge Score", marginX, y);
      doc.text("Delta Score", marginX + 95, y);
      y += 9;
      doc.setFontSize(22);
      doc.text(`${k}`, marginX, y);
      doc.text(`${d > 0 ? "+" : ""}${d}`, marginX + 95, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const kLines = doc.splitTextToSize(`${ki.label}: ${ki.desc}`, 80);
      doc.text(kLines, marginX, y);
      const dLines = doc.splitTextToSize(`${di.label}: ${di.desc}`, 80);
      doc.text(dLines, marginX + 95, y);
      y += Math.max(kLines.length, dLines.length) * 4.5 + 10;

      ensureSpace(7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Judge's Assessment", marginX, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      renderWrapped(doc.splitTextToSize(result.judge_notes || "No notes provided.", pageWidth), 5);
      y += 6;

      if (d <= -2) {
        ensureSpace(6);
        doc.setTextColor(190, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Fraud signal detected", marginX, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0);
        renderWrapped(doc.splitTextToSize("The delta score indicates a significant gap between claimed qualifications and demonstrated knowledge. We recommend additional verification before proceeding with this candidate.", pageWidth), 4.5);
        y += 6;
      }

      if (result.audio_transcript) {
        ensureSpace(7);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Session Audio Transcript", marginX, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        renderWrapped(doc.splitTextToSize(result.audio_transcript, pageWidth), 4.5);
        y += 6;
      }

      if (idx < results.length - 1) {
        ensureSpace(10);
        doc.setDrawColor(200);
        doc.line(marginX, y, marginX + pageWidth, y);
        y += 10;
      }
    });

    const anyTranscript = results.some(r => r.audio_transcript);
    doc.save(`PeerProof-${assessment.candidate_name.replace(/\s+/g, "_")}-${anyTranscript ? "Full" : "Lite"}-Report.pdf`);
  }

  const allHaveTranscript = results.every(r => r.audio_transcript);

  return (
    <PW>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px" }}>
        <button onClick={() => router.push("/hr")} style={{ background: "none", border: "none", cursor: "pointer", color: MU, fontSize: 13, marginBottom: 20, fontFamily: ff }}>← Dashboard</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: ffH, fontSize: 26, fontWeight: 800, color: N }}>{assessment.candidate_name}</h1>
            <p style={{ color: MU, fontSize: 14, marginTop: 4 }}>{assessment.candidate_field} · {assessment.candidate_degree} · {assessment.candidate_university}</p>
            {assessment.languages && assessment.languages.length > 0 && (
              <p style={{ color: MU, fontSize: 13, marginTop: 4 }}>🗣 <LanguageSummary languages={assessment.languages} /></p>
            )}
          </div>
          <Badge label={assessment.status === "completed" ? "Completed" : (isPendingSecondRound ? "2nd opinion pending" : isInProgressSecondRound ? "2nd opinion in progress" : assessment.status)} color={assessment.status === "completed" ? GR : AM} />
        </div>

        {(isPendingSecondRound || isInProgressSecondRound) && (
          <div style={{ background: TEL, border: `1px solid ${TE}33`, borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: TE, fontWeight: 600 }}>
              A second opinion is {isPendingSecondRound ? "waiting for a judge to accept" : "currently in progress"}. The first round's result below remains valid in the meantime.
            </p>
          </div>
        )}

        {results.map((result, idx) => {
          const k = result.knowledge_score;
          const d = result.delta_score;
          const ki = KNOWLEDGE[k];
          const di = DELTA.find(x => x.v === d);
          const pct = ((d + 3) / 6) * 100;
          const round = result.round || idx + 1;
          const status = transcriptStatus[round] || "idle";
          const judgeLabel = judgeForRound(round);

          return (
            <div key={result.id} style={{ marginBottom: 28, paddingBottom: results.length > 1 ? 20 : 0, borderBottom: results.length > 1 && idx < results.length - 1 ? `2px solid ${BR}` : "none" }}>
              {results.length > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <h2 style={{ fontFamily: ffH, fontSize: 17, fontWeight: 800, color: N }}>{round === 1 ? "Round 1" : `Round ${round} — Second Opinion`}</h2>
                  {judgeLabel && <Badge label={judgeLabel} color={N} />}
                </div>
              )}
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
                <p style={{ fontSize: 14, color: TX, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{result.judge_notes}</p>
              </Card>
              {d <= -2 && (
                <div style={{ background: RDL, border: `1px solid ${RD}28`, borderRadius: 10, padding: 16, marginBottom: 18 }}>
                  <p style={{ fontWeight: 700, color: RD, fontSize: 14, marginBottom: 4 }}>⚠ Fraud signal detected</p>
                  <p style={{ fontSize: 13, color: MU, lineHeight: 1.65 }}>The delta score indicates a significant gap between claimed qualifications and demonstrated knowledge. We recommend additional verification before proceeding with this candidate.</p>
                </div>
              )}
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                {!result.audio_transcript && status !== "failed" && (
                  <Btn ch={status === "generating" ? "Generating…" : `Generate Transcript${results.length > 1 ? ` (Round ${round})` : ""}`} v="ghost" onClick={() => generateTranscript(round, result.id)} />
                )}
                {!result.audio_transcript && status === "failed" && (
                  <Btn ch="Generation Failed — Report" v="ghost" onClick={() => reportFailure(round)} />
                )}
                {result.audio_transcript && <Badge label="Transcript ready" color={GR} />}
              </div>
            </div>
          );
        })}

        {showSlots && (
          <Card sx={{ marginBottom: 18, border: `1.5px solid ${TE}` }}>
            <h3 style={{ fontFamily: ffH, fontSize: 15, fontWeight: 700, color: N, marginBottom: 4 }}>When is the candidate available for the second interview?</h3>
            <p style={{ fontSize: 12, color: MU, marginBottom: 14 }}>This is a brand-new interview with a different judge. Provide at least one time.</p>
            <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
              {["slot1", "slot2", "slot3"].map(key => (
                <input key={key} type="datetime-local" value={slots[key]} onChange={e => setSlots(p => ({ ...p, [key]: e.target.value }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${BR}`, fontSize: 14, fontFamily: ff, boxSizing: "border-box" }} />
              ))}
            </div>
            {actionError && <p style={{ color: RD, fontSize: 13, marginBottom: 12 }}>{actionError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <Btn ch={requesting ? "Submitting…" : "Confirm second opinion request"} onClick={requestSecondOpinion} />
              <Btn ch="Cancel" v="ghost" onClick={() => { setShowSlots(false); setActionError(""); }} />
            </div>
          </Card>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
          <Btn ch={allHaveTranscript ? "Download Full Report" : "Download Lite Report"} onClick={downloadPDF} />
          {canRequestSecondOpinion && !showSlots && (
            <Btn ch="Request second opinion" v="ghost" onClick={() => setShowSlots(true)} />
          )}
        </div>
        {transcriptError && <p style={{ color: RD, fontSize: 13, marginTop: 10 }}>{transcriptError}</p>}
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
