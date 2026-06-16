'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Card, PW } from "@/components/ui";
import { N, MU, RD, ffH, ff } from "@/lib/theme";

export default function HRSignup() {
  const router = useRouter();
  const [f, setF] = useState({ joinCode: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const upd = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #dde4ee", fontSize: 14, fontFamily: ff, boxSizing: "border-box" };

  async function submit() {
    if (!f.joinCode || !f.name || !f.email || !f.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/hr-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
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
          <p style={{ color: MU, marginTop: 12, lineHeight: 1.75, fontSize: 14 }}>You can now log in with your email and password.</p>
          <div style={{ marginTop: 24 }}><Btn ch="Go to login" onClick={() => router.push("/hr/login")} /></div>
        </div>
      </PW>
    );
  }

  return (
    <PW>
      <div style={{ maxWidth: 440, margin: "80px auto", padding: "0 24px" }}>
        <h1 style={{ fontFamily: ffH, fontSize: 24, fontWeight: 800, color: N, marginBottom: 6, textAlign: "center" }}>Create your HR account</h1>
        <p style={{ color: MU, fontSize: 13, marginBottom: 24, textAlign: "center" }}>Use the company account code you received from PeerProof.</p>
        <Card>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Company account code</label>
              <input value={f.joinCode} onChange={upd("joinCode")} placeholder="e.g. AB23CD45" style={{ ...inp, textTransform: "uppercase" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Your name</label>
              <input value={f.name} onChange={upd("name")} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Work email</label>
              <input type="email" value={f.email} onChange={upd("email")} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Password</label>
              <input type="password" value={f.password} onChange={upd("password")} style={inp} />
            </div>
          </div>
          {error && <p style={{ color: RD, fontSize: 13, marginTop: 12 }}>{error}</p>}
          <div style={{ marginTop: 16 }}>
            <Btn ch={loading ? "Creating account…" : "Create account"} sz="lg" full onClick={submit} />
          </div>
          <p style={{ fontSize: 12, color: MU, marginTop: 14, textAlign: "center" }}>
            Already have an account? <a href="/hr/login" style={{ color: "#2a9d8f" }}>Log in</a>
          </p>
        </Card>
      </div>
    </PW>
  );
}
