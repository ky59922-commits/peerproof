'use client';
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRequireAdmin } from "@/lib/useRequireAdmin";
import { Btn, Badge, Card, Stat, PW, TopBar } from "@/components/ui";
import { N, AM, BL, GR, RD, TEL, TE, MU, BR, ASSESSMENTS, STC, STL, ffH } from "@/lib/theme";

export default function Admin() {
  const router = useRouter();
  const { checking, adminName } = useRequireAdmin();

  const judges = [
    { code: "A", field: "Machine Learning / AI", level: "PhD", sessions: 12, rating: "4.8", univ: "University of Tokyo" },
    { code: "B", field: "Molecular Biology", level: "PostDoc", sessions: 7, rating: "4.9", univ: "Kyoto University" },
    { code: "C", field: "Behavioral Economics", level: "PhD", sessions: 5, rating: "4.7", univ: "Waseda University" },
    { code: "D", field: "Machine Learning / AI", level: "Master", sessions: 3, rating: "4.6", univ: "University of Tokyo" },
  ];

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (checking) {
    return <PW><div style={{ padding: 60, textAlign: "center", color: MU }}>Checking access…</div></PW>;
  }

  return (
    <PW>
      <TopBar
        label="PLATFORM ADMIN"
        sub={`Operations dashboard${adminName ? ` — ${adminName}` : ""}`}
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Btn ch="Applications" onClick={() => router.push("/admin/applications")} />
            <Btn ch="Log out" v="ghost" onClick={logout} />
          </div>
        }
      />
      <div style={{ padding: "24px 36px", display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 8 }}>
        <Stat label="Total assessments" val={47} color={N} />
        <Stat label="Pending" val={12} color={AM} />
        <Stat label="In progress" val={4} color={BL} />
        <Stat label="Completed" val={31} color={GR} />
        <Stat label="Fraud signals" val={4} color={RD} />
      </div>
      <div style={{ padding: "16px 36px 36px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <Card>
          <h2 style={{ fontFamily: ffH, fontSize: 16, fontWeight: 700, color: N, marginBottom: 16 }}>Recent assessments</h2>
          {ASSESSMENTS.map(a => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BR}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.candidate.name}</div>
                <div style={{ fontSize: 12, color: MU }}>{a.candidate.field} · {a.candidate.degree}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Badge label={STL[a.status]} color={STC[a.status]} />
                {a.result && <Badge label={`Δ${a.result.d > 0 ? "+" : ""}${a.result.d}`} color={a.result.d <= -2 ? RD : GR} />}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14 }}><Btn ch="View all assessments" v="ghost" sz="sm" onClick={() => router.push("/hr")} /></div>
        </Card>
        <Card>
          <h2 style={{ fontFamily: ffH, fontSize: 16, fontWeight: 700, color: N, marginBottom: 16 }}>Judge pool — UTokyo cohort</h2>
          {judges.map(j => (
            <div key={j.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BR}` }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: TEL, color: TE, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>{j.code}</div>
                <div><div style={{ fontWeight: 600, fontSize: 13 }}>Judge {j.code} <span style={{ color: MU, fontWeight: 400 }}>(anonymous)</span></div><div style={{ fontSize: 12, color: MU }}>{j.field} · {j.level}</div></div>
              </div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 600, color: GR }}>★ {j.rating}</div><div style={{ fontSize: 12, color: MU }}>{j.sessions} sessions</div></div>
            </div>
          ))}
          <div style={{ marginTop: 14 }}><Btn ch="+ Invite judge" v="ghost" sz="sm" /></div>
        </Card>
      </div>
    </PW>
  );
}
