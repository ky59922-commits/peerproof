'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TE, W, RD } from "@/lib/theme";

const ff = "'Inter',sans-serif", ffH = "'Syne',sans-serif";

export default function MeetingRoom({ isJudge, nextPath, candidateName = "Tanaka Hiroshi" }) {
  const router = useRouter();
  const [secs, setSecs] = useState(1800);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const t = setInterval(() => setSecs(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = s => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", display: "flex", flexDirection: "column", padding: 16, gap: 12, fontFamily: ff }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: ffH, fontWeight: 800, fontSize: 16, color: TE }}>Δ PeerProof session</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ background: "#1e293b", borderRadius: 8, padding: "5px 14px", color: W, fontSize: 15, fontFamily: ffH, fontWeight: 700 }}>{fmt(secs)}</div>
          <span style={{ background: RD + "22", color: "#fca5a5", border: `1px solid ${RD}44`, borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 600 }}>● REC</span>
        </div>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: isJudge ? "1fr 1fr 240px" : "1fr 1fr", gap: 10, minHeight: 300 }}>
        <div style={{ background: "#1e293b", borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, position: "relative" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#94a3b8" }}>?</div>
          <span style={{ color: "#94a3b8", fontSize: 13 }}>{isJudge ? "Candidate" : "Anonymous peer reviewer"}</span>
          <div style={{ position: "absolute", bottom: 10, left: 10, background: "#00000066", borderRadius: 5, padding: "2px 7px", fontSize: 11, color: "#e2e8f0" }}>{isJudge ? candidateName : "Machine Learning · PhD"}</div>
        </div>
        <div style={{ background: camOff ? "#1e293b" : "#1a3554", borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, position: "relative", border: `2px solid ${TE}` }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: camOff ? "#334155" : TE + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👤</div>
          <span style={{ color: camOff ? "#94a3b8" : W, fontSize: 13 }}>{camOff ? "Camera off" : "You"}</span>
          <div style={{ position: "absolute", bottom: 10, left: 10, background: "#00000066", borderRadius: 5, padding: "2px 7px", fontSize: 11, color: "#e2e8f0" }}>{isJudge ? "Judge (anonymous)" : candidateName}</div>
          {muted && <div style={{ position: "absolute", top: 10, right: 10, background: RD, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>🔇</div>}
        </div>
        {isJudge && (
          <div style={{ background: "#1e293b", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 11, color: TE, fontWeight: 600, margin: 0 }}>SESSION NOTES</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note key observations during the session..." style={{ flex: 1, background: "#0f172a", border: `1px solid #1e3a5f`, borderRadius: 8, padding: 10, color: "#e2e8f0", fontSize: 12, fontFamily: ff, resize: "none", minHeight: 220 }} />
            <p style={{ fontSize: 10, color: "#475569", margin: 0 }}>Notes are private and expire after scoring</p>
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
        <button onClick={() => setMuted(!muted)} style={{ width: 48, height: 48, borderRadius: "50%", background: muted ? RD : "#1e293b", border: "none", cursor: "pointer", fontSize: 18 }}>{muted ? "🔇" : "🎤"}</button>
        <button onClick={() => setCamOff(!camOff)} style={{ width: 48, height: 48, borderRadius: "50%", background: camOff ? RD : "#1e293b", border: "none", cursor: "pointer", fontSize: 18 }}>{camOff ? "🚫" : "📷"}</button>
        <button onClick={() => router.push(nextPath)} style={{ padding: "0 24px", height: 48, borderRadius: 24, background: RD, border: "none", cursor: "pointer", color: W, fontWeight: 600, fontSize: 14, fontFamily: ff }}>End session</button>
      </div>
    </div>
  );
}
