'use client';
import { useState, useRef, useEffect } from "react";

// Common nationalities/countries. "Other" not needed — list is comprehensive enough;
// free typing filters this list.
export const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Bangladesh","Belgium",
  "Brazil","Bulgaria","Cambodia","Cameroon","Canada","Chile","China","Colombia","Croatia",
  "Czech Republic","Denmark","Egypt","Estonia","Ethiopia","Finland","France","Georgia","Germany",
  "Ghana","Greece","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Laos","Latvia","Lebanon",
  "Lithuania","Malaysia","Mexico","Mongolia","Morocco","Myanmar","Nepal","Netherlands","New Zealand",
  "Nigeria","North Macedonia","Norway","Pakistan","Peru","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Saudi Arabia","Serbia","Singapore","Slovakia","Slovenia","South Africa",
  "South Korea","Spain","Sri Lanka","Sweden","Switzerland","Taiwan","Tanzania","Thailand","Tunisia",
  "Turkey","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay",
  "Uzbekistan","Venezuela","Vietnam","Other",
];

// Searchable country combobox. `value` is the selected string; `onChange(str)`.
export function CountrySelect({ value, onChange, border = "#dde4ee", font = "inherit", placeholder = "Type to search…" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = query.trim()
    ? COUNTRIES.filter(c => c.toLowerCase().includes(query.trim().toLowerCase()))
    : COUNTRIES;

  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${border}`, fontSize: 14, fontFamily: font, boxSizing: "border-box" };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        style={inp}
        value={open ? query : (value || "")}
        placeholder={value || placeholder}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
      />
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, maxHeight: 220, overflowY: "auto", background: "#fff", border: `1.5px solid ${border}`, borderRadius: 8, zIndex: 30, boxShadow: "0 6px 18px rgba(0,0,0,0.08)" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "9px 12px", fontSize: 13, color: "#9aa6b8" }}>No match</div>
          ) : (
            filtered.map(c => (
              <div
                key={c}
                onClick={() => { onChange(c); setOpen(false); setQuery(""); }}
                style={{ padding: "8px 12px", fontSize: 14, cursor: "pointer", background: c === value ? "#e6f5f3" : "#fff" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
                onMouseLeave={e => (e.currentTarget.style.background = c === value ? "#e6f5f3" : "#fff")}
              >
                {c}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Work experience editor: repeatable rows of { field, years }.
export function ExperienceEditor({ value, onChange, accent = "#2a9d8f", border = "#dde4ee", muted = "#6b7280", font = "inherit" }) {
  const rows = value || [];

  function update(idx, key, v) {
    onChange(rows.map((r, i) => (i === idx ? { ...r, [key]: v } : r)));
  }
  function add() {
    onChange([...rows, { field: "", years: "" }]);
  }
  function remove(idx) {
    onChange(rows.filter((_, i) => i !== idx));
  }

  const inp = { padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${border}`, fontSize: 14, fontFamily: font, boxSizing: "border-box" };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.length === 0 && <p style={{ fontSize: 12, color: muted, margin: 0 }}>No work experience added yet.</p>}
      {rows.map((row, idx) => (
        <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            style={{ ...inp, flex: 2 }}
            value={row.field}
            onChange={e => update(idx, "field", e.target.value)}
            placeholder="Field / area (e.g. Machine Learning, Finance)"
          />
          <input
            style={{ ...inp, width: 110 }}
            type="number"
            min="0"
            step="0.5"
            value={row.years}
            onChange={e => update(idx, "years", e.target.value)}
            placeholder="Years"
          />
          <button type="button" onClick={() => remove(idx)} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "0 4px" }} aria-label="Remove">×</button>
        </div>
      ))}
      <button type="button" onClick={add} style={{ background: "none", border: `1.5px dashed ${accent}`, color: accent, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 12px", borderRadius: 8, fontFamily: font, width: "fit-content" }}>
        + Add experience
      </button>
    </div>
  );
}

// Inline display, e.g. "Machine Learning (3 yrs), Finance (2 yrs)"
export function ExperienceSummary({ experience, style }) {
  const rows = (experience || []).filter(e => e.field && e.field.trim());
  if (rows.length === 0) return <span style={{ color: "#9aa6b8", fontSize: 12, ...style }}>—</span>;
  return (
    <span style={{ fontSize: 12, ...style }}>
      {rows.map((e, i) => (
        <span key={i}>
          {e.field}{e.years ? ` (${e.years} yr${Number(e.years) === 1 ? "" : "s"})` : ""}{i < rows.length - 1 ? ", " : ""}
        </span>
      ))}
    </span>
  );
}
