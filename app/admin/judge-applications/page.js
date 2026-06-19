'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRequireAdmin } from "@/lib/useRequireAdmin";
import { Btn, Badge, Card, PW, TopBar } from "@/components/ui";
import { N, GR, RD, AM, MU, BR, ffH } from "@/lib/theme";

function generateCode(len, chars) {
  let code = "";
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
const SIGNUP_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LABEL_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export default function JudgeApplications() {
  const router = useRouter();
  const { checking } = useRequireAdmin();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvedInfo, setApprovedInfo] = useState(null);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.from("judge_applications").select("*").order("created_at", { ascending: false });
    if (!error) setApps(data || []);
    setLoading(false);
  }

  useEffect(() => { if (!checking) refresh(); }, [checking]);

  async function approve(app) {
    const signupCode = generateCode(8, SIGNUP_CHARS);
    const label = generateCode(3, LABEL_CHARS);
    const { data: judge, error: judgeError } = await supabase.from("judges").insert({
      code: label,
      name: app.name,
      field: app.field,
      level: app.degree_level,
      university: app.university,
      email: app.university_email,
      phone: app.phone,
      lab_info: app.lab_info,
      lab_url: app.lab_url,
      research_summary: app.research_summary,
      program_year: app.program_year,
      signup_code: signupCode,
      active: false,
    }).select().single();
    if (judgeError) {
      alert("Failed to create judge: " + judgeError.message);
      return;
    }
    const { error: updateError } = await supabase.from("judge_applications").update({
      status: "approved",
      judge_id: judge.id,
    }).eq("id", app.id);
    if (updateError) {
      alert("Judge created but failed to update application status: " + updateError.message);
      return;
    }
    setApprovedInfo({ name: app.name, code: signupCode, email: app.university_email });
    notifyJudgeDecision("approved", app, signupCode);
    refresh();
  }

  async function notifyJudgeDecision(decision, app, code) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch("/api/notify-judge-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          decision,
          name: app.name,
          email: app.university_email,
          signupCode: code || null,
          signupUrl: `${window.location.origin}/judge/signup`,
        }),
      });
    } catch (e) { /* best-effort */ }
  }

  async function reject(app) {
    await supabase.from("judge_applications").update({ status: "rejected" }).eq("id", app.id);
    notifyJudgeDecision("rejected", app, null);
    refresh();
  }

  if (checking) {
    return <PW><div style={{ padding: 60, textAlign: "center", color: MU }}>Checking access…</div></PW>;
  }

  const statusColor = { pending: AM, approved: GR, rejected: RD };

  return (
    <PW>
      <TopBar label="PLATFORM ADMIN" sub="Judge applications" onBack={() => router.push("/admin")} />
      <div style={{ padding: "28px 36px" }}>
        {approvedInfo && (
          <Card sx={{ marginBottom: 20, background: "#f0fdf4", border: "1px solid #16a34a44" }}>
            <p style={{ fontWeight: 700, color: GR, fontSize: 14, marginBottom: 8 }}>✓ {approvedInfo.name} approved</p>
            <p style={{ fontSize: 13, color: MU, marginBottom: 10 }}>
              Send this signup code to <strong>{approvedInfo.email}</strong> — they'll use it to create their login:
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: ffH, fontSize: 22, fontWeight: 800, color: N, background: "#fff", padding: "8px 16px", borderRadius: 8, border: "1px solid #dde4ee", letterSpacing: "0.1em" }}>{approvedInfo.code}</span>
              <Btn ch="Copy code" sz="sm" v="ghost" onClick={() => navigator.clipboard.writeText(approvedInfo.code)} />
            </div>
          </Card>
        )}
        <Card>
          <h2 style={{ fontFamily: ffH, fontSize: 17, fontWeight: 700, color: N, marginBottom: 20 }}>Applications</h2>
          {loading ? (
            <p style={{ color: MU, fontSize: 14 }}>Loading…</p>
          ) : apps.length === 0 ? (
            <p style={{ color: MU, fontSize: 14 }}>No applications yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${BR}` }}>
                  {["Name", "University", "Level", "Field", "Lab", "Research summary", "Status", "Action"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: MU, fontSize: 12, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map(app => (
                  <tr key={app.id} style={{ borderBottom: `1px solid ${BR}` }}>
                    <td style={{ padding: "14px 12px", fontWeight: 600 }}>{app.name}<div style={{ fontSize: 11, color: MU }}>{app.university_email}</div><div style={{ fontSize: 11, color: MU }}>{app.phone}</div></td>
                    <td style={{ padding: "14px 12px", color: MU, fontSize: 13 }}>{app.university}</td>
                    <td style={{ padding: "14px 12px", color: MU, fontSize: 13 }}>{app.degree_level} ({app.program_year})</td>
                    <td style={{ padding: "14px 12px", color: MU, fontSize: 13 }}>{app.field}</td>
                    <td style={{ padding: "14px 12px", color: MU, fontSize: 13 }}>
                      {app.lab_info}
                      {app.lab_url && <div><a href={app.lab_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2a9d8f" }}>Lab page →</a></div>}
                    </td>
                    <td style={{ padding: "14px 12px", color: MU, fontSize: 13, maxWidth: 240 }}>{app.research_summary}</td>
                    <td style={{ padding: "14px 12px" }}><Badge label={app.status} color={statusColor[app.status] || MU} /></td>
                    <td style={{ padding: "14px 12px" }}>
                      {app.status === "pending" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn ch="Approve" sz="sm" onClick={() => approve(app)} />
                          <Btn ch="Reject" sz="sm" v="ghost" onClick={() => reject(app)} />
                        </div>
                      ) : (
                        <span style={{ color: MU, fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </PW>
  );
}
