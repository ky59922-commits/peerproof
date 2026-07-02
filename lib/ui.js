'use client';
import { useState } from "react";
import { N, TE, TED, TEL, BG, W, TX, MU, BR, ff, ffH } from "@/lib/theme";

// Load fonts once in the browser only
if (typeof document !== "undefined" && !document.getElementById("pp-fonts")) {
  const s = document.createElement("style");
  s.id = "pp-fonts";
  s.textContent = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');`;
  document.head.appendChild(s);
}

export const Btn = ({ ch, onClick, v = "primary", sz = "md", full }) => {
  const [h, sH] = useState(false);
  const base = { border: "none", borderRadius: 8, cursor: "pointer", fontFamily: ff, fontWeight: 600, transition: "background .12s", display: "inline-flex", alignItems: "center", gap: 6, width: full ? "100%" : "auto", justifyContent: full ? "center" : "flex-start" };
  const S = { sm: { padding: "6px 14px", fontSize: 13 }, md: { padding: "10px 22px", fontSize: 14 }, lg: { padding: "13px 30px", fontSize: 16 } }[sz];
  const C = { primary: { background: h ? TED : TE, color: W }, navy: { background: h ? "#122844" : N, color: W }, ghost: { background: h ? BG : "transparent", color: TX, border: `1.5px solid ${BR}` }, danger: { background: h ? "#b91c1c" : "#dc2626", color: W } }[v];
  return <button style={{ ...base, ...S, ...C }} onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)} onClick={onClick}>{ch}</button>;
};

export const Badge = ({ label, color = TE }) => <span style={{ background: color + "18", color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1px solid ${color}28` }}>{label}</span>;

export const Card = ({ children, sx = {} }) => <div style={{ background: W, borderRadius: 12, border: `1px solid ${BR}`, padding: 24, color: TX, ...sx }}>{children}</div>;

export const Stat = ({ label, val, color = N }) => (
  <Card sx={{ textAlign: "center", padding: "20px 16px" }}>
    <div style={{ fontSize: 30, fontWeight: 800, color, fontFamily: ffH }}>{val}</div>
    <div style={{ fontSize: 13, color: MU, marginTop: 4 }}>{label}</div>
  </Card>
);

export const Sep = () => <div style={{ height: 1, background: BR, margin: "20px 0" }} />;

export const PW = ({ children }) => <div style={{ minHeight: "100vh", background: BG, fontFamily: ff, color: TX }}>{children}</div>;

export const TopBar = ({ label, sub, onBack, action }) => (
  <div style={{ background: N, color: W, padding: "28px 36px" }}>
    {onBack && <button onClick={onBack} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13, marginBottom: 12, fontFamily: ff, display: "flex", alignItems: "center", gap: 4 }}>← Back</button>}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div>
        <div style={{ fontSize: 11, color: TE, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
        <h1 style={{ fontFamily: ffH, fontSize: 26, fontWeight: 800, margin: 0 }}>{sub}</h1>
      </div>
      {action}
    </div>
  </div>
);
