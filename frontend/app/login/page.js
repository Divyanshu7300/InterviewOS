"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

const icons = {
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
  eyeDot: "M12 15a3 3 0 100-6 3 3 0 000 6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22",
  alert: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  lock: "M7 11V7a5 5 0 0110 0v4M5 11h14v10H5z",
  spark: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
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

function Field({ label, id, type = "text", value, onChange, onKeyDown, placeholder, autoComplete, rightSlot }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
        {label}
      </label>
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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.access_token, { email, username: res.data.username, id: res.data.user_id ?? res.data.id });
      router.push("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => e.key === "Enter" && !loading && handleLogin();

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
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200/80">Welcome Back</p>
              <h1 className="mt-3 max-w-3xl text-[40px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[58px]">
                Pick up your interview prep where you left it.
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-200/80 sm:text-[16px]">
                Jump back into your JD analysis, resume fit, mock interviews, skill learning, and community threads.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Prep loop", value: "Role-first" },
                  { label: "Practice", value: "AI mocks" },
                  { label: "Progress", value: "XP + streaks" },
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Sign In</p>
                  <h2 className="mt-2 text-[30px] font-black tracking-[-0.03em] text-[var(--text-primary)]">Welcome back</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Access your prep workspace.</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-sky-300/25 bg-sky-400/10 text-sky-300">
                  <Icon paths={icons.lock} size={18} />
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <Field label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKey} placeholder="you@example.com" autoComplete="email" />
                <Field
                  label="Password"
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Minimum 8 characters"
                  autoComplete="current-password"
                  rightSlot={
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">
                      {showPw ? <Icon paths={icons.eyeOff} /> : <Icon paths={[icons.eye, icons.eyeDot]} />}
                    </button>
                  }
                />

                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs font-semibold text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--text-primary)]">
                    Forgot password?
                  </Link>
                </div>

                <AnimatePresence>
                  {error ? (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                      <Icon paths={icons.alert} size={14} /> {error}
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <button onClick={handleLogin} disabled={loading} className="mt-1 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[20px] px-5 text-sm font-bold text-slate-950 transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40" style={{ background: "var(--brand-gradient)", boxShadow: "0 18px 50px rgba(125, 211, 252, 0.18)" }}>
                  {loading ? <><Spinner /> Signing in...</> : "Sign in"}
                </button>

                <p className="text-center text-sm text-[var(--text-secondary)]">
                  No account? <Link href="/signup" className="font-bold text-[var(--text-primary)] underline underline-offset-4">Create one</Link>
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
