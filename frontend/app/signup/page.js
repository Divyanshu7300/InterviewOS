"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";

const icons = {
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
  eyeDot: "M12 15a3 3 0 100-6 3 3 0 000 6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22",
  alert: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  check: "M20 6L9 17l-5-5",
};

const Icon = ({ paths, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(paths) ? paths : [paths]).map((d) => <path key={d} d={d} />)}
  </svg>
);

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay },
});

const pwChecks = [
  { label: "8+ chars", test: (p) => p.length >= 8 },
  { label: "Uppercase", test: (p) => /[A-Z]/.test(p) },
  { label: "Number", test: (p) => /[0-9]/.test(p) },
  { label: "Symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = pwChecks.filter((c) => c.test(password)).length;
  const colors = ["bg-rose-400", "bg-amber-400", "bg-sky-400", "bg-emerald-400"];
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const textColors = ["text-rose-300", "text-amber-300", "text-sky-300", "text-emerald-300"];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score - 1] : "bg-[var(--border)]"}`} />
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className={`text-xs font-bold ${textColors[score - 1] || "text-[var(--text-muted)]"}`}>{labels[score - 1] || ""}</span>
        <div className="flex flex-wrap gap-2">
          {pwChecks.map((c) => (
            <span key={c.label} className={`rounded-[12px] border px-2 py-1 text-[10px] font-bold ${c.test(password) ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300" : "border-[var(--border)] text-[var(--text-muted)]"}`}>
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
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`min-h-[52px] w-full rounded-[18px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 text-[15px] font-medium text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-sky-300/30 ${rightSlot ? "pr-12" : ""}`}
        />
        {rightSlot ? <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightSlot}</div> : null}
      </div>
    </div>
  );
}

const Spinner = () => (
  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: "rgba(15,23,42,0.22)", borderTopColor: "rgb(15,23,42)" }} />
);

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !username) { setError("Please fill in all fields."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    if (username.length < 3) { setError("Username must be 3+ characters."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/signup", { email, username, password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") setError(detail);
      else if (Array.isArray(detail)) setError(detail.map((d) => d.msg || JSON.stringify(d)).join(", "));
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => e.key === "Enter" && !loading && handleSignup();

  if (success) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <motion.div {...fadeUp(0)} className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center shadow-[0_24px_80px_rgba(3,7,18,0.24)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-emerald-300/25 bg-emerald-400/10 text-emerald-300">
          <Icon paths={icons.check} size={24} />
        </div>
        <h2 className="mt-5 text-2xl font-black text-[var(--text-primary)]">Account created</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Redirecting to login...</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-6 sm:px-5">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-6xl flex-col gap-6">
        <Link href="/" className="w-fit rounded-[16px] px-3 py-2 text-base font-black tracking-[-0.03em] text-[var(--text-primary)] no-underline">
          interview<span className="opacity-40">OS</span>
        </Link>

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_430px] lg:items-center">
          <motion.section {...fadeUp(0)} className="theme-hero relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-8 shadow-[0_28px_90px_rgba(3,7,18,0.34)] sm:px-8 sm:py-10">
            <div className="absolute inset-0" style={{ background: "var(--hero-surface)" }} />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200/80">Create Workspace</p>
              <h1 className="mt-3 max-w-3xl text-[40px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[58px]">
                Build a focused interview prep loop from day one.
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-200/80 sm:text-[16px]">
                Start with JD analysis, match your resume, practice with AI, and track your learning momentum.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Analyze", value: "JDs" },
                  { label: "Improve", value: "Resume fit" },
                  { label: "Practice", value: "AI interviews" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.div {...fadeUp(0.08)} className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[0_24px_80px_rgba(3,7,18,0.24)] sm:p-7">
            <div className="absolute inset-0 opacity-80" style={{ background: "var(--panel-glow)" }} />
            <div className="relative">
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Register</p>
                  <h2 className="mt-2 text-[30px] font-black tracking-[-0.03em] text-[var(--text-primary)]">Create account</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Free to use. No credit card required.</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-sky-300/25 bg-sky-400/10 text-sky-300">
                  <Icon paths={icons.user} size={18} />
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <Field label="Email" id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKey} placeholder="you@example.com" autoComplete="email" />
                <Field label="Username" id="su-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={onKey} placeholder="cooldev42" autoComplete="username" />
                <div className="flex flex-col gap-2">
                  <Field
                    label="Password"
                    id="su-password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    rightSlot={
                      <button type="button" onClick={() => setShowPw((v) => !v)} className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">
                        {showPw ? <Icon paths={icons.eyeOff} /> : <Icon paths={[icons.eye, icons.eyeDot]} />}
                      </button>
                    }
                  />
                  <PasswordStrength password={password} />
                </div>

                <AnimatePresence>
                  {error ? (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                      <Icon paths={icons.alert} size={14} /> {error}
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <button onClick={handleSignup} disabled={loading} className="mt-1 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[20px] px-5 text-sm font-bold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40" style={{ background: "var(--brand-gradient)", boxShadow: "0 18px 50px rgba(125, 211, 252, 0.18)" }}>
                  {loading ? <><Spinner /> Creating account...</> : "Create account"}
                </button>

                <p className="text-center text-sm text-[var(--text-secondary)]">
                  Already have an account? <Link href="/login" className="font-bold text-[var(--text-primary)] underline underline-offset-4">Sign in</Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <p className="text-center text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Secured · Encrypted · Yours</p>
      </div>
    </div>
  );
}
