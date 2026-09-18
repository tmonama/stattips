import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/api";
import { setSession } from "../lib/auth";

export default function AdminLogin() {
  const nav = useNavigate();
  const [step, setStep] = useState<"email" | "password" | "mfa">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitPassword() {
    setErr(""); setBusy(true);
    try {
      const t = await login(email, password);   // real Django token; email box = username
      setToken(t);
      setStep("mfa");
    } catch {
      setErr("Your account or password is incorrect.");
    } finally { setBusy(false); }
  }

  function verifyMfa() {
    if (!/^\d{6}$/.test(code)) { setErr("Enter the 6-digit code."); return; }
    setSession(token, email);                    // 2FA is simulated
    nav("/admin", { replace: true });
  }

  return (
    <div className="ms-bg">
      <div className="ms-card">
        <div className="ms-logo" aria-hidden="true">
          <span style={{ background: "#f25022" }} /><span style={{ background: "#7fba00" }} />
          <span style={{ background: "#00a4ef" }} /><span style={{ background: "#ffb900" }} />
        </div>

        {step === "email" && (
          <>
            <h2>Sign in</h2>
            <p className="ms-sub">to continue to <strong>StatTips Console</strong></p>
            <input className="ms-input" type="text" autoFocus placeholder="Email, phone, or Skype"
                   value={email} onChange={(e) => setEmail(e.target.value)}
                   onKeyDown={(e) => e.key === "Enter" && email && setStep("password")} />
            <p className="ms-link">No account? <a href="#" onClick={(e) => e.preventDefault()}>Create one!</a></p>
            <div className="ms-actions"><button className="ms-next" disabled={!email} onClick={() => setStep("password")}>Next</button></div>
          </>
        )}

        {step === "password" && (
          <>
            <p className="ms-back" onClick={() => { setStep("email"); setErr(""); }}>← {email}</p>
            <h2>Enter password</h2>
            <input className="ms-input" type="password" autoFocus placeholder="Password"
                   value={password} onChange={(e) => setPassword(e.target.value)}
                   onKeyDown={(e) => e.key === "Enter" && password && submitPassword()} />
            {err && <p className="ms-err">{err}</p>}
            <div className="ms-actions"><button className="ms-next" disabled={!password || busy} onClick={submitPassword}>{busy ? "Signing in…" : "Sign in"}</button></div>
          </>
        )}

        {step === "mfa" && (
          <>
            <h2>Verify your identity</h2>
            <p className="ms-sub">Enter the code from your authenticator app.</p>
            <input className="ms-input ms-code" inputMode="numeric" maxLength={6} autoFocus placeholder="000000"
                   value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                   onKeyDown={(e) => e.key === "Enter" && verifyMfa()} />
            {err && <p className="ms-err">{err}</p>}
            <p className="ms-hint">Prototype: any 6-digit code is accepted.</p>
            <div className="ms-actions"><button className="ms-next" onClick={verifyMfa}>Verify</button></div>
          </>
        )}
      </div>
      <p className="ms-foot">Simulated single sign-on for the GovTech 2026 prototype — not a real Microsoft sign-in. Production would use Microsoft Entra ID (OAuth 2.0 / MSAL).</p>
    </div>
  );
}