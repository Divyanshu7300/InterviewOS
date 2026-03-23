"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import ProtectedRoute from "../../../../components/ProtectedRoute";

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16, filter: "blur(4px)" },
  animate:    { opacity: 1, y: 0,  filter: "blur(0px)" },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay },
});

function ScoreRing({ score }) {
  const pct   = Math.round((score / 10) * 100);
  const color = score >= 7 ? "#4ade80" : score >= 4 ? "#facc15" : "#f87171";
  const r     = 40;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none"
          stroke="var(--border)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle"
          style={{ fill: color, fontSize: 20, fontWeight: 700 }}>
          {score.toFixed(1)}
        </text>
        <text x="50" y="65" textAnchor="middle"
          style={{ fill: "var(--text-muted)", fontSize: 9 }}>
          / 10
        </text>
      </svg>
    </div>
  );
}

function Tag({ text, color }) {
  const styles = {
    green:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    red:    "text-red-400 bg-red-500/10 border-red-500/20",
    amber:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };
  return (
    <span className={`text-[12px] px-3 py-1.5 rounded-xl border font-medium ${styles[color]}`}>
      {text}
    </span>
  );
}

const LEVEL_COLOR = {
  EASY:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  HARD:   "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function InterviewResultPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("interviewResult");
    if (!raw) { router.push("/dashboard/interview"); return; }
    setResult(JSON.parse(raw));
  }, []);

  if (!result) return null;

  const score     = result.overall_score ?? 0;
  const scoreColor = score >= 7 ? "#4ade80" : score >= 4 ? "#facc15" : "#f87171";
  const verdict   = score >= 7 ? "Strong Performance" : score >= 4 ? "Decent Attempt" : "Needs Improvement";
  const lc        = LEVEL_COLOR[result.level] || LEVEL_COLOR.MEDIUM;

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-32" style={{ paddingTop: "72px", background: "var(--bg-primary)" }}>
        <div className="max-w-2xl mx-auto px-5 flex flex-col gap-8">

          {/* ── HERO ── */}
          <motion.div {...fadeUp(0)} className="pt-12 flex flex-col gap-3">
            <p className="text-[11px] font-semibold tracking-[0.22em] uppercase"
              style={{ color: "var(--text-muted)" }}>
              Interview Complete
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[36px] font-extrabold tracking-tight leading-[1.08]"
                style={{ color: "var(--text-primary)" }}>
                {result.roleTitle || "Interview"}
              </h1>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${lc}`}>
                {result.level}
              </span>
            </div>
            <p className="text-[15px] font-light" style={{ color: "var(--text-muted)" }}>
              Here's how you performed in this session.
            </p>
          </motion.div>

          {/* ── SCORE CARD ── */}
          <motion.div {...fadeUp(0.08)}
            className="rounded-2xl p-6 border flex items-center gap-8"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <ScoreRing score={score} />
            <div className="flex flex-col gap-2">
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold"
                style={{ color: "var(--text-muted)" }}>
                Overall Score
              </p>
              <p className="text-2xl font-extrabold" style={{ color: scoreColor }}>
                {verdict}
              </p>
              <p className="text-[14px] font-light leading-relaxed max-w-sm"
                style={{ color: "var(--text-muted)" }}>
                {result.summary}
              </p>
            </div>
          </motion.div>

          {/* ── STRENGTHS ── */}
          {result.strengths?.length > 0 && (
            <motion.div {...fadeUp(0.14)}
              className="rounded-2xl p-6 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-4"
                style={{ color: "var(--text-muted)" }}>
                Strengths
              </p>
              <div className="flex flex-col gap-3">
                {result.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold text-sm mt-0.5 flex-shrink-0">✓</span>
                    <p className="text-[14px] font-light leading-relaxed"
                      style={{ color: "var(--text-primary)" }}>
                      {s}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── IMPROVEMENTS ── */}
          {result.improvements?.length > 0 && (
            <motion.div {...fadeUp(0.18)}
              className="rounded-2xl p-6 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-4"
                style={{ color: "var(--text-muted)" }}>
                Areas to Improve
              </p>
              <div className="flex flex-col gap-3">
                {result.improvements.map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-amber-400 font-bold text-sm mt-0.5 flex-shrink-0">→</span>
                    <p className="text-[14px] font-light leading-relaxed"
                      style={{ color: "var(--text-primary)" }}>
                      {s}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── ACTIONS ── */}
          <motion.div {...fadeUp(0.22)} className="flex gap-3">
            <Link href="/dashboard/interview"
              className="flex-1 py-3 rounded-xl text-sm font-bold text-center no-underline transition-all active:scale-[0.98]"
              style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
              Start New Interview →
            </Link>
            <Link href="/dashboard"
              className="px-5 py-3 rounded-xl text-sm font-medium text-center no-underline border transition-all"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-card)" }}>
              Dashboard
            </Link>
          </motion.div>

        </div>
      </div>
    </ProtectedRoute>
  );
}