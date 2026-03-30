"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ProtectedRoute from "../../../../components/ProtectedRoute";

const checklist = [
  "Eye contact with camera",
  "Clear and confident voice",
  "No excessive filler words (um, uh)",
  "Good posture and body language",
  "Structured answers (STAR method)",
  "Technical accuracy of answers",
  "Response time — not too fast or slow",
  "Professional appearance",
];

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16, filter: "blur(4px)" },
  animate:    { opacity: 1, y: 0,  filter: "blur(0px)" },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay },
});

const SELF_RATING_META = {
  confidence: { label: "How confident did you sound?", accent: "#a78bfa" },
  clarity: { label: "How structured was your answer?", accent: "#f59e0b" },
  depth: { label: "How deep was your technical reasoning?", accent: "#38bdf8" },
  correctness: { label: "How accurate were your answers?", accent: "#4ade80" },
};

const gapLabel = (gap) => {
  if (gap >= 1.5) return "Overconfident";
  if (gap <= -1.5) return "Undersold";
  return "Aligned";
};

export default function InterviewRecordingPage() {
  const router = useRouter();
  const [recordedUrl] = useState(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("recordingUrl");
  });
  const [session] = useState(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("interviewSession");
    const resultRaw = sessionStorage.getItem("interviewResult");
    return raw ? JSON.parse(raw) : resultRaw ? JSON.parse(resultRaw) : null;
  });
  const [checked,     setChecked]     = useState([]);
  const [selfRating, setSelfRating] = useState({
    confidence: 6,
    clarity: 6,
    depth: 6,
    correctness: 6,
  });

  const toggleCheck = (item) =>
    setChecked(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  const downloadRecording = () => {
    if (!recordedUrl) return;
    const a = document.createElement("a");
    a.href     = recordedUrl;
    a.download = `interview-${session?.sessionId || "session"}.webm`;
    a.click();
  };

  const completionPct = Math.round((checked.length / checklist.length) * 100);
  const reflectionTone = completionPct >= 75
    ? "Strong self-review. Next step is repeating the same questions with sharper delivery."
    : completionPct >= 40
      ? "Good pass. Rewatch once more and note exactly where energy or structure dropped."
      : "Start with the basics and mark the easiest misses first. Small corrections compound fast.";
  const aiScores = session?.session_insights?.skill_scores || {};
  const ratingGaps = Object.keys(SELF_RATING_META).map((metric) => {
    const ai = aiScores[metric] ?? 0;
    const self = selfRating[metric];
    return {
      metric,
      ai,
      self,
      gap: Number((self - ai).toFixed(1)),
      label: gapLabel(self - ai),
    };
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">

        {/* ── TOP BAR ── */}
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-primary)] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${recordedUrl ? "bg-emerald-400" : ""}`}
              style={!recordedUrl ? { background: "var(--text-primary)", opacity: 0.28 } : {}} />
            <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">
              {session?.roleTitle ? `Recording — ${session.roleTitle}` : "Interview Recording"}
            </span>
          </div>
          <button
            onClick={() => router.push("/dashboard/interview")}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-opacity hover:opacity-80">
            ← Back
          </button>
        </div>

        {/* ── CONTENT ── */}
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-20 pt-2 sm:px-5">

          {!recordedUrl ? (
            /* ── EMPTY STATE ── */
            <motion.div {...fadeUp(0)}
              className="flex flex-col items-center justify-center gap-4 pt-24 text-center">
              <p className="text-4xl">📹</p>
              <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                No recording found
              </h2>
              <p className="text-base leading-7 text-[var(--text-primary)]">
                Record your next interview session to review it here.
              </p>
              <button
                onClick={() => router.push("/dashboard/interview")}
                className="mt-2 rounded-xl bg-[var(--text-primary)] px-5 py-3 text-sm font-bold text-[var(--bg-primary)] transition-opacity hover:opacity-80">
                Start an Interview →
              </button>
            </motion.div>

          ) : (
            <>
              {/* ── HERO ── */}
              <motion.div {...fadeUp(0)} className="mb-8 flex flex-col gap-3 pt-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em]"
                  style={{ color: "var(--text-primary)" }}>
                  Review
                </p>
                <h1 className="text-[36px] font-extrabold tracking-tight leading-[1.08]"
                  style={{ color: "var(--text-primary)" }}>
                  Your Recording
                </h1>
                <p className="text-base leading-7"
                  style={{ color: "var(--text-primary)" }}>
                  Watch your session back, download it, and use the checklist below to self-evaluate.
                </p>
              </motion.div>

              {/* ── VIDEO PLAYER ── */}
              <motion.div {...fadeUp(0.08)}
                className="mb-4 overflow-hidden rounded-[28px] border"
                style={{ background: "#000", borderColor: "var(--border)" }}>
                <video src={recordedUrl} controls className="w-full block" style={{ maxHeight: 520 }} />
              </motion.div>

              {/* ── DOWNLOAD ── */}
              <motion.div {...fadeUp(0.12)} className="mb-8">
                <button
                  onClick={downloadRecording}
                  className="rounded-xl border px-5 py-3 text-sm font-bold transition-opacity hover:opacity-80"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                  ↓ Download Recording
                </button>
              </motion.div>

              {/* ── SELF EVALUATION CHECKLIST ── */}
              <motion.div {...fadeUp(0.16)}
                className="rounded-[28px] border p-6 sm:p-7"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>

                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="mb-1 text-sm font-semibold uppercase tracking-[0.18em]"
                      style={{ color: "var(--text-primary)" }}>
                      Checklist
                    </p>
                    <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                      Self Evaluation
                    </h2>
                  </div>
                  <span className="rounded-full border px-3 py-1.5 text-sm font-semibold"
                    style={{
                      background: checked.length === checklist.length ? "rgba(52,211,153,0.1)" : "var(--bg-secondary)",
                      borderColor: checked.length === checklist.length ? "rgba(52,211,153,0.2)" : "var(--border)",
                      color: checked.length === checklist.length ? "#34d399" : "var(--text-primary)",
                    }}>
                    {checked.length}/{checklist.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {checklist.map(item => {
                    const done = checked.includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggleCheck(item)}
                        className="flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all"
                        style={{
                          background: done ? "rgba(52,211,153,0.06)" : "var(--bg-secondary)",
                          borderColor: done ? "rgba(52,211,153,0.2)" : "var(--border)",
                        }}>
                        <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all"
                          style={{
                            background: done ? "#34d399" : "transparent",
                            borderColor: done ? "#34d399" : "var(--border)",
                          }}>
                          {done && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm leading-6"
                          style={{ color: done ? "#34d399" : "var(--text-primary)" }}>
                          {item}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {checked.length === checklist.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-5 rounded-xl border px-4 py-3 text-center text-sm"
                    style={{ background: "rgba(52,211,153,0.06)", borderColor: "rgba(52,211,153,0.2)", color: "#34d399" }}>
                    ✓ All items checked — great session!
                  </motion.div>
                )}
              </motion.div>

              <motion.div {...fadeUp(0.2)}
                className="mt-6 rounded-[28px] border p-6 sm:p-7"
                style={{
                  background: "linear-gradient(135deg, rgba(56,189,248,0.08), rgba(52,211,153,0.08))",
                  borderColor: "var(--border)",
                }}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="mb-1 text-sm font-semibold uppercase tracking-[0.18em]"
                      style={{ color: "var(--text-primary)" }}>
                      Reflection Meter
                    </p>
                    <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                      {completionPct}% review complete
                    </h2>
                  </div>
                  <span className="rounded-full border px-3 py-1.5 text-sm font-semibold"
                    style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                    {checked.length}/{checklist.length} checks
                  </span>
                </div>
                <div className="mt-4 h-2.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${completionPct}%`,
                      background: "linear-gradient(90deg, #38bdf8, #34d399)",
                    }} />
                </div>
                <p className="mt-4 text-base leading-7"
                  style={{ color: "var(--text-primary)" }}>
                  {reflectionTone}
                </p>
              </motion.div>

              <motion.div {...fadeUp(0.24)}
                className="mt-6 rounded-[28px] border p-6 sm:p-7"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="mb-5">
                  <p className="mb-1 text-sm font-semibold uppercase tracking-[0.18em]"
                    style={{ color: "var(--text-primary)" }}>
                    Calibration
                  </p>
                  <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    Compare your self-rating with AI evaluation
                  </h2>
                </div>

                <div className="flex flex-col gap-5">
                  {Object.entries(SELF_RATING_META).map(([metric, meta]) => (
                    <div key={metric} className="rounded-xl border px-4 py-4"
                      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-sm font-medium leading-6" style={{ color: "var(--text-primary)" }}>
                          {meta.label}
                        </p>
                        <span className="text-sm font-semibold" style={{ color: meta.accent }}>
                          Self {selfRating[metric]}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={selfRating[metric]}
                        onChange={(e) => setSelfRating(prev => ({ ...prev, [metric]: Number(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="mt-3 flex items-center justify-between text-sm"
                        style={{ color: "var(--text-primary)" }}>
                        <span>AI {Number(aiScores[metric] ?? 0).toFixed(1)}/10</span>
                        <span>{gapLabel(selfRating[metric] - (aiScores[metric] ?? 0))}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {ratingGaps.map((item) => (
                    <div key={item.metric} className="rounded-xl border px-4 py-4"
                      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                      <p className="mb-1 text-sm font-semibold uppercase tracking-[0.14em]"
                        style={{ color: "var(--text-primary)" }}>
                        {SELF_RATING_META[item.metric].label}
                      </p>
                      <p className="text-base font-bold" style={{ color: SELF_RATING_META[item.metric].accent }}>
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm" style={{ color: "var(--text-primary)" }}>
                        Gap: {item.gap > 0 ? "+" : ""}{item.gap} points
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
