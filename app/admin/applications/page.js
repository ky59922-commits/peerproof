'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRequireAdmin } from "@/lib/useRequireAdmin";
import { Btn, Badge, Card, PW, TopBar } from "@/components/ui";
import { N, GR, RD, AM, MU, BR, ffH } from "@/lib/theme";

function generateJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous O/0, I/1
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function Applications() {
  const router = useRouter();
  const { checking } = useRequireAdmin();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvedInfo, setApprovedInfo] = useState(null);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.from("company_applications").select("*").order("created_at", { ascending: false });
    if (!error) setApps(data || []);
    setLoading(false);
  }

  useEffect(() => { if (!checking) refresh(); }, [checking]);

  async function notifyCompanyDecision(decision, app, code) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch("/api/notify-company-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          decision,
          contactName: app.contact_name,
          contactEmail: app.contact_email,
          companyName: app.company_name,
          joinCode: code || null,
          signupUrl: `${window.location.origin}/hr/signup`,
        }),
      });
    } catch (e) { /* best-effort */ }
  }

  async function approve(app) {
    const code = generateJoinCode();
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({ name: app.company_name, email: app.contact_email, join_code: code })
      .select()
      .single();
    if (companyError) {
      alert("Failed to create company: " + companyError.message);
      return;
    }
    const { error: updateError } = await supabase
      .from("company_applications")
      .update({ status: "approved", company_id: company.id })
      .eq("id", app.id);
    if (updateError) {
      alert("Company created but failed to update application status: " + updateError.message);
      return;
    }
    setApprovedInfo({ companyName: app.company_name, code, email: app.contact_email });
    notifyCompanyDecision("approved", app, code);
    refresh();
  }

  async function reject(app) {
    await supabase.from("company_applications").update({ status: "rejected" }).eq("id", app.id);
    notifyCompanyDecision("rejected", app, null);
    refresh();
  }

  if (checking) {
    return <PW><div style={{ padding: 60, textAlign: "center", color: MU }}>Checking access…</div></PW>;
  }

  const statusColor = { pending: AM, approved: GR, rejected: RD };

  return (
    <PW>
      <TopBar label="PLATFORM ADMIN" sub="Company applications" onBack={() => router.push("/admin")} />
      <div style={{ padding: "28px 36px" }}>
        {approvedInfo && (
          <Card sx={{ marginBottom: 20, background: "#f0fdf4", border: "1px solid #16a34a44" }}>
            <p style={{ fontWeight: 700, color: GR, fontSize: 14, marginBottom: 8 }}>✓ {approvedInfo.companyName} approved</p>
            <p style={{ fontSize: 13, color: MU, marginBottom: 10 }}>
              Send this account code to <strong>{approvedInfo.email}</strong> — their HR team uses it to sign up (up to 5 people):
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
                  {["Company", "Contact", "Email", "Message", "Status", "Action"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: MU, fontSize: 12, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map(app => (
                  <tr key={app.id} style={{ borderBottom: `1px solid ${BR}` }}>
                    <td style={{ padding: "14px 12px", fontWeight: 600 }}>{app.company_name}</td>
                    <td style={{ padding: "14px 12px" }}>{app.contact_name}</td>
                    <td style={{ padding: "14px 12px", color: MU, fontSize: 13 }}>{app.contact_email}</td>
                    <td style={{ padding: "14px 12px", color: MU, fontSize: 13, maxWidth: 220 }}>{app.message || "—"}</td>
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
