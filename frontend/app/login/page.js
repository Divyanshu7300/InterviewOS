"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

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
          className={[
            "w-full rounded-xl px-4 py-[10px] text-[14px] font-light outline-none transition-all duration-150",
            "border focus:ring-0",
            rightSlot ? "pr-11" : "",
          ].join(" ")}
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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
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
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-primary)" }}>

      {/* top-left breadcrumb — same as homepage nav feel */}
      <div className="fixed top-5 left-6 z-20">
        <span className="text-[13px] font-semibold tracking-tight"
          style={{ color: "var(--text-muted)" }}>
          InterviewOS <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>/ login</span>
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm rounded-2xl p-8 border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* header */}
        <div className="mb-7">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-3"
            style={{ color: "var(--text-muted)" }}>
            Welcome back
          </p>
          <h1 className="text-[30px] font-extrabold leading-none tracking-tight"
            style={{ color: "var(--text-primary)" }}>
            Sign in
          </h1>
          <p className="text-sm mt-2 font-light"
            style={{ color: "var(--text-muted)" }}>
            Pick up where you left off.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Email" id="email" type="email" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={onKey}
            placeholder="you@example.com" autoComplete="email" />

          <Field label="Password" id="password"
            type={showPw ? "text" : "password"} value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={onKey}
            placeholder="••••••••" autoComplete="current-password"
            rightSlot={
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="transition-opacity opacity-30 hover:opacity-60"
                style={{ color: "var(--text-primary)" }}>
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            }
          />

          <div className="flex justify-end -mt-1">
            <a href="/forgot-password"
              className="text-[12px] transition-opacity opacity-40 hover:opacity-70"
              style={{ color: "var(--text-primary)" }}>
              Forgot password?
            </a>
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

          {/* CTA — same as homepage "Get Started" button */}
          <button
            onClick={handleLogin} disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
            {loading ? <><Spinner /> Signing in…</> : "Sign in →"}
          </button>

          <p className="text-center text-[13px] font-light"
            style={{ color: "var(--text-muted)" }}>
            No account?{" "}
            <a href="/signup"
              className="font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
              style={{ color: "var(--text-primary)" }}>
              Create one
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