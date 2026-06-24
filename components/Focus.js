'use client';

export const FOCUS_TAGS = [
  "Depth of claimed research",
  "Hands-on vs. theoretical knowledge",
  "Specific methodology / tools",
  "Consistency with CV timeline",
  "Communication ability",
  "Problem-solving approach",
];

// Returns true if a focus object has any meaningful content
export function hasFocus(focus) {
  if (!focus) return false;
  const hasTags = Array.isArray(focus.tags) && focus.tags.length > 0;
  const hasText = [focus.topics, focus.skills, focus.concerns].some(t => t && t.trim());
  return hasTags || hasText;
}

// Editor used on the HR new-assessment form.
// `value` is the focus object; `onChange` receives the updated object.
export function FocusEditor({ value, onChange, accent = "#2a9d8f", border = "#dde4ee", muted = "#6b7280", ink = "#1a2b4a", text = "#111827", font = "inherit" }) {
  const focus = value || {};
  const tags = focus.tags || [];

  function toggleTag(tag) {
    const next = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
    onChange({ ...focus, tags: next });
  }
  function setField(field, v) {
    onChange({ ...focus, [field]: v });
  }

  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${border}`, fontSize: 14, fontFamily: font, boxSizing: "border-box", resize: "vertical" };

  return (
    <div>
      <p style={{ fontSize: 12, color: muted, marginTop: 0, marginBottom: 10 }}>Tick the areas you want the judge to focus on:</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {FOCUS_TAGS.map(tag => {
          const on = tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              style={{
                padding: "7px 12px",
                borderRadius: 20,
                border: `1.5px solid ${on ? accent : border}`,
                background: on ? "#e6f5f3" : "#fff",
                color: on ? accent : text,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: ink }}>Specific topics to probe</label>
          <textarea value={focus.topics || ""} onChange={e => setField("topics", e.target.value)} rows={2} placeholder="e.g. their claimed work on transformer attention mechanisms" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: ink }}>Claimed skills to verify</label>
          <textarea value={focus.skills || ""} onChange={e => setField("skills", e.target.value)} rows={2} placeholder="e.g. 3 years hands-on experience with PyTorch" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: ink }}>Any concerns or red flags</label>
          <textarea value={focus.concerns || ""} onChange={e => setField("concerns", e.target.value)} rows={2} placeholder="e.g. unexplained CV gap in 2023–2024" style={inp} />
        </div>
      </div>
    </div>
  );
}

// Read-only display of the focus, used on the judge queue, HR result, admin, etc.
export function FocusDisplay({ focus, muted = "#6b7280", ink = "#1a2b4a", accent = "#2a9d8f", compact = false }) {
  if (!hasFocus(focus)) return null;
  const tags = focus.tags || [];
  const fields = [
    ["Topics to probe", focus.topics],
    ["Skills to verify", focus.skills],
    ["Concerns", focus.concerns],
  ].filter(([, v]) => v && v.trim());

  return (
    <div style={{ fontSize: 13 }}>
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: fields.length ? 8 : 0 }}>
          {tags.map(tag => (
            <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: accent, background: "#e6f5f3", borderRadius: 12, padding: "3px 9px" }}>{tag}</span>
          ))}
        </div>
      )}
      {fields.map(([label, val]) => (
        <div key={label} style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: ink }}>{label}: </span>
          <span style={{ color: muted }}>{val}</span>
        </div>
      ))}
    </div>
  );
}
