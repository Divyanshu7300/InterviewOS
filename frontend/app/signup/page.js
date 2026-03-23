"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";

const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const AlertIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const pwChecks = [
  { label: "8+ chars",  test: p => p.length >= 8 },
  { label: "Uppercase", test: p => /[A-Z]/.test(p) },
  { label: "Number",    test: p => /[0-9]/.test(p) },
  { label: "Symbol",    test: p => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = pwChecks.filter(c => c.test(password)).length;

  const barColor = ["bg-rose-400", "bg-amber-400", "bg-blue-400", "bg-emerald-400"][score - 1] || "";
  const label    = ["Weak", "Fair", "Good", "Strong"][score - 1] || "";
  const labelColor = ["text-rose-400", "text-amber-400", "text-blue-400", "text-emerald-400"][score - 1] || "";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i}
            className={`h-px flex-1 rounded-full transition-all duration-300 ${i <= score ? barColor : ""}`}
            style={{ background: i <= score ? undefined : "var(--border)" }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-medium ${labelColor}`}>{label}</span>
        <div className="flex gap-3">
          {pwChecks.map(c => (
            <span key={c.label}
              className="text-[10px] transition-colors"
              style={{ color: "var(--text-muted)", opacity: c.test(password) ? 1 : 0.3 }}>
              {c.test(password) ? "✓" : "·"} {c.label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, id, type = "text", value, onChange, onKeyDown, placeholder, autoComplete, rightSlot }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id}
        className="text-[11px] font-semibold tracking-[0.18em] uppercase"
        style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id} type={type} value={value} onChange={onChange}
          onKeyDown={onKeyDown} placeholder={placeholder} autoComplete={autoComplete}
          className={["w-full rounded-xl px-4 py-[10px] text-[14px] font-light outline-none transition-all duration-150 border focus:ring-0", rightSlot ? "pr-11" : ""].join(" ")}
          style={{
            background: "var(--bg-primary)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
        {rightSlot && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}

const Spinner = () => (
  <span className="w-4 h-4 border-2 rounded-full animate-spin inline-block"
    style={{ borderColor: "var(--border)", borderTopColor: "var(--text-primary)" }} />
);

export default function SignupPage() {
  const router = useRouter();

  const [email,    setEmail]    = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !username) { setError("Please fill in all fields."); return; }
    if (!email.includes("@"))             { setError("Enter a valid email address."); return; }
    if (username.length < 3)              { setError("Username must be 3+ characters."); return; }
    if (password.length < 8)             { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    try {
      await api.post("/auth/signup", { email, username, password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string")   setError(detail);
      else if (Array.isArray(detail))   setError(detail.map(d => d.msg || JSON.stringify(d)).join(", "));
      else                              setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => e.key === "Enter" && !loading && handleSignup();

  if (success) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-primary)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl"
          style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}>
          ✓
        </div>
        <h2 className="text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>
          Account created!
        </h2>
        <p className="text-sm font-light" style={{ color: "var(--text-muted)" }}>
          Redirecting to login…
        </p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-primary)" }}>

      <div className="fixed top-5 left-6 z-20">
        <span className="text-[13px] font-semibold tracking-tight"
          style={{ color: "var(--text-muted)" }}>
          InterviewOS{" "}
          <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>/ signup</span>
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm rounded-2xl p-8 border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="mb-7">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-3"
            style={{ color: "var(--text-muted)" }}>
            Get started
          </p>
          <h1 className="text-[30px] font-extrabold leading-none tracking-tight"
            style={{ color: "var(--text-primary)" }}>
            Create account
          </h1>
          <p className="text-sm mt-2 font-light"
            style={{ color: "var(--text-muted)" }}>
            Free to use. No credit card required.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Email" id="su-email" type="email" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={onKey}
            placeholder="you@example.com" autoComplete="email" />

          <Field label="Username" id="su-username" type="text" value={username}
            onChange={e => setUsername(e.target.value)} onKeyDown={onKey}
            placeholder="cooldev42" autoComplete="username" />

          <div className="flex flex-col gap-2">
            <Field label="Password" id="su-password"
              type={showPw ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={onKey}
              placeholder="Minimum 8 characters" autoComplete="new-password"
              rightSlot={
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="transition-opacity opacity-30 hover:opacity-60"
                  style={{ color: "var(--text-primary)" }}>
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              }
            />
            <PasswordStrength password={password} />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[13px] px-3.5 py-2.5 rounded-xl border"
                style={{ background: "rgba(244,63,94,0.08)", color: "#fb7185", borderColor: "rgba(244,63,94,0.18)" }}>
                <AlertIcon /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={handleSignup} disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
            {loading ? <><Spinner /> Creating account…</> : "Create account →"}
          </button>

          <p className="text-center text-[13px] font-light"
            style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <a href="/login"
              className="font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
              style={{ color: "var(--text-primary)" }}>
              Sign in
            </a>
          </p>
        </div>
      </motion.div>

      <p className="absolute bottom-6 text-[10px] tracking-widest uppercase"
        style={{ color: "var(--text-muted)", opacity: 0.4 }}>
        Secured · Encrypted · Yours
      </p>
    </div>
  );
}