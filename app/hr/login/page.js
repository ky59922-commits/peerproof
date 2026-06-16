'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Btn, Card, PW } from "@/components/ui";
import { N, MU, RD, ffH, ff } from "@/lib/theme";

export default function HRLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #dde4ee", fontSize: 14, fontFamily: ff, boxSizing: "border-box" };

  async function login() {
    setLoading(true);
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }
    const { data: membership } = await supabase
      .from("company_users")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    setLoading(false);
    if (!membership) {
      await supabase.auth.signOut();
      setError("This account is not linked to a company.");
      return;
    }
    router.push("/hr");
  }

  return (
    <PW>
      <div style={{ maxWidth: 400, margin: "100px auto", padding: "0 24px" }}>
        <h1 style={{ fontFamily: ffH, fontSize: 24, fontWeight: 800, color: N, marginBottom: 20, textAlign: "center" }}>HR Login</h1>
        <Card>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} style={inp} />
            </div>
          </div>
          {error && <p style={{ color: RD, fontSize: 13, marginTop: 12 }}>{error}</p>}
          <div style={{ marginTop: 16 }}>
            <Btn ch={loading ? "Logging in…" : "Log in"} sz="lg" full onClick={login} />
          </div>
          <p style={{ fontSize: 12, color: MU, marginTop: 14, textAlign: "center" }}>
            Don't have an account yet? <a href="/hr/signup" style={{ color: "#2a9d8f" }}>Sign up with your company code</a>
          </p>
        </Card>
      </div>
    </PW>
  );
}
