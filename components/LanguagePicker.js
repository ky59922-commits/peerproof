'use client';
import { useState } from "react";

export const LANGUAGES = [
  "Japanese", "English", "Chinese (Mandarin)", "Korean", "Spanish",
  "French", "German", "Portuguese", "Russian", "Hindi",
  "Arabic", "Vietnamese", "Thai", "Indonesian", "Italian", "Other",
];

export const LANG_LEVELS = [
  { key: "daily", label: "Daily conversation" },
  { key: "presentation", label: "Presentation / discussion" },
  { key: "native", label: "Native / fluent" },
];

export function levelLabel(key) {
  return LANG_LEVELS.find(l => l.key === key)?.label || key;
}

// Small inline summary used in tables/cards, e.g. "Japanese (Native), English (Daily conversation)"
export function LanguageSummary({ languages, style }) {
  if (!languages || languages.length === 0) {
    return <span style={{ color: "#9aa6b8", fontSize: 12, ...style }}>—</span>;
  }
  return (
    <span style={{ fontSize: 12, ...style }}>
      {languages.map((l, i) => (
        <span key={i}>
          {l.language} <span style={{ color: "#6b7280" }}>({levelLabel(l.level)})</span>{i < languages.length - 1 ? ", " : ""}
        </span>
      ))}
    </span>
  );
}

// Repeatable editor: pick a language + level, add more rows, remove rows.
// `value` is an array of { language, level }; `onChange` receives the new array.
export function LanguagePicker({ value, onChange, accent = "#2a9d8f", border = "#dde4ee", font = "inherit" }) {
  const rows = value && value.length > 0 ? value : [];

  function update(idx, field, v) {
    const next = rows.map((r, i) => (i === idx ? { ...r, [field]: v } : r));
    onChange(next);
  }
  function add() {
    onChange([...rows, { language: LANGUAGES[0], level: LANG_LEVELS[0].key }]);
  }
  function remove(idx) {
    onChange(rows.filter((_, i) => i !== idx));
  }

  const sel = { padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${border}`, fontSize: 13, fontFamily: font, boxSizing: "border-box" };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.length === 0 && (
        <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>No languages added yet.</p>
      )}
      {rows.map((row, idx) => (
        <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={row.language} onChange={e => update(idx, "language", e.target.value)} style={{ ...sel, flex: 1 }}>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
          <select value={row.level} onChange={e => update(idx, "level", e.target.value)} style={{ ...sel, flex: 1 }}>
            {LANG_LEVELS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
          </select>
          <button type="button" onClick={() => remove(idx)} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "0 4px" }} aria-label="Remove">×</button>
        </div>
      ))}
      <button type="button" onClick={add} style={{ background: "none", border: `1.5px dashed ${accent}`, color: accent, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 12px", borderRadius: 8, fontFamily: font, width: "fit-content" }}>
        + Add language
      </button>
    </div>
  );
}
