"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";

const AlertIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const Spinner = () => (
  <span className="w-4 h-4 border-2 rounded-full animate-spin inline-block"
    style={{ borderColor: "var(--border)", borderTopColor: "var(--text-primary)" }} />
);

function Tag({ children, color = "default" }) {
  const styles = {
    default: { background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" },
    blue:    { background: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.2)", color: "#60a5fa" },
    emerald: { background: "rgba(52,211,153,0.1)", borderColor: "rgba(52,211,153,0.2)", color: "#34d399" },
    amber:   { background: "rgba(251,191,36,0.1)",  borderColor: "rgba(251,191,36,0.2)",  color: "#fbbf24" },
    purple:  { background: "rgba(167,139,250,0.1)", borderColor: "rgba(167,139,250,0.2)", color: "#a78bfa" },
  };
  return (
    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border"
      style={styles[color]}>
      {children}
    </span>
  );
}

function Card({ title, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-2xl p-5 flex flex-col gap-3 border"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      {children}
    </motion.div>
  );
}

export default function JDAnalyzer() {
  const router      = useRouter();
  const { user }    = useAuth() ?? {};
  const userId      = user?.id ? parseInt(user.id) : null;

  const [jdText,  setJdText]  = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);

  const analyzeJD = async () => {
    if (!jdText.trim()) return;
    if (!userId) { setError("Please log in first."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/jd/analyze", {
        jd_text: jdText,
        user_id: userId,
      });
      setResult(res.data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") setError(detail);
      else setError("Failed to analyze JD. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 px-5"
      style={{ paddingTop: "72px", background: "var(--bg-primary)" }}>
      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-6"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: "var(--text-muted)" }}>
            JD Analyzer
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Decode any Job Description
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Paste a JD and extract skills, interview topics, and resume keywords instantly.
          </p>
        </motion.div>

        {/* ── INPUT ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-2xl p-5 flex flex-col gap-4 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Paste the job description here..."
            rows={10}
            className="w-full rounded-xl px-4 py-3 text-sm font-light outline-none resize-none transition-all duration-150"
            style={{
              background:   "var(--bg-secondary)",
              border:       "1px solid var(--border)",
              color:        "var(--text-primary)",
            }}
          />

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[13px] px-3.5 py-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertIcon /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={analyzeJD}
            disabled={loading || !jdText.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: "var(--text-primary)",
              color:      "var(--bg-primary)",
            }}
          >
            {loading ? <><Spinner /> Analyzing…</> : "Analyze JD →"}
          </button>
        </motion.div>

        {/* ── RESULT ── */}
        {result && (
          <div className="flex flex-col gap-4">

            {/* Role Overview */}
            <Card title="Role Overview" delay={0}>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {result.role_title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {result.role_summary}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Tag color="blue">🎯 {result.seniority_level || "Unknown"}</Tag>
                <Tag color="amber">⏱ {result.experience_required || "N/A"}</Tag>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Tech Stack */}
              <Card title="Tech Stack" delay={0.05}>
                <div className="flex flex-wrap gap-2">
                  {result.tech_stack?.map(t => (
                    <Tag key={t} color="blue">{t}</Tag>
                  ))}
                </div>
              </Card>

              {/* Soft Skills */}
              <Card title="Soft Skills" delay={0.08}>
                <ul className="flex flex-col gap-1.5">
                  {result.soft_skills?.map((s, i) => (
                    <li key={i} className="text-[13px] flex items-center gap-2"
                      style={{ color: "var(--text-primary)" }}>
                      <span style={{ color: "var(--text-muted)" }}>·</span> {s}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Key Responsibilities */}
              <Card title="Key Responsibilities" delay={0.11}>
                <ul className="flex flex-col gap-1.5">
                  {result.key_responsibilities?.map((r, i) => (
                    <li key={i} className="text-[13px] flex items-start gap-2"
                      style={{ color: "var(--text-primary)" }}>
                      <span className="mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }}>·</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Interview Topics */}
              <Card title="Interview Topics" delay={0.14}>
                <ul className="flex flex-col gap-1.5">
                  {result.interview_topics?.map((t, i) => (
                    <li key={i} className="text-[13px] flex items-center gap-2"
                      style={{ color: "var(--text-primary)" }}>
                      <span style={{ color: "var(--text-muted)" }}>·</span> {t}
                    </li>
                  ))}
                </ul>
              </Card>

            </div>

            {/* Resume Keywords */}
            <Card title="Resume Keywords" delay={0.17}>
              <div className="flex flex-wrap gap-2">
                {result.resume_keywords?.map(k => (
                  <Tag key={k} color="emerald">{k}</Tag>
                ))}
              </div>
            </Card>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex gap-3 flex-wrap"
            >
              <button
                onClick={() => router.push(`/dashboard/resume`)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
                style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
                Upload Resume →
              </button>
              <button
                onClick={() => router.push(`/dashboard/interview`)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] border"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-card)" }}>
                Start AI Interview →
              </button>
            </motion.div>

          </div>
        )}

      </div>
    </div>
  );
}