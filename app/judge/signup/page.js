'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Card, PW } from "@/components/ui";
import { N, MU, RD, ffH, ff } from "@/lib/theme";

export default function JudgeSignup() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #dde4ee", fontSize: 14, fontFamily: ff, boxSizing: "border-box" };

  async function submit() {
    if (!code || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/judge-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signupCode: code, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <PW>
        <div style={{ maxWidth: 440, margin: "100px auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>✓</div>
          <h2 style={{ fontFamily: ffH, fontSize: 24, fontWeight: 800, color: N }}>Account created</h2>
          <p style={{ color: MU, marginTop: 12, lineHeight: 1.75, fontSize: 14 }}>You can now log in with your university email and password.</p>
          <div style={{ marginTop: 24 }}><Btn ch="Go to login" onClick={() => router.push("/judge/login")} /></div>
        </div>
      </PW>
    );
  }

  return (
    <PW>
      <div style={{ maxWidth: 420, margin: "100px auto", padding: "0 24px" }}>
        <h1 style={{ fontFamily: ffH, fontSize: 24, fontWeight: 800, color: N, marginBottom: 6, textAlign: "center" }}>Create your judge account</h1>
        <p style={{ color: MU, fontSize: 13, marginBottom: 24, textAlign: "center" }}>Enter the signup code you received by email.</p>
        <Card>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Signup code</label>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. AB23CD45" style={{ ...inp, textTransform: "uppercase" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Choose a password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inp} />
            </div>
          </div>
          {error && <p style={{ color: RD, fontSize: 13, marginTop: 12 }}>{error}</p>}
          <div style={{ marginTop: 16 }}>
            <Btn ch={loading ? "Creating account…" : "Create account"} sz="lg" full onClick={submit} />
          </div>
          <p style={{ fontSize: 12, color: MU, marginTop: 14, textAlign: "center" }}>
            Already have an account? <a href="/judge/login" style={{ color: "#2a9d8f" }}>Log in</a>
          </p>
        </Card>
      </div>
    </PW>
  );
}
