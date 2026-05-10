"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "../../../lib/axios";
import { useAuth } from "../../../context/AuthContext";
import ProtectedRoute from "../../../components/ProtectedRoute";
import JDSelector from "../../../components/JDSelector";

const LEVELS = ["EASY", "MEDIUM", "HARD"];
const LEVEL_META = {
  EASY: {
    text: "text-emerald-300",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.22)",
    glow: "rgba(16, 185, 129, 0.2)",
    title: "Warm-up flow",
    detail: "Cleaner prompts, lower pressure, confidence building.",
  },
  MEDIUM: {
    text: "text-sky-300",
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.24)",
    glow: "rgba(56, 189, 248, 0.18)",
    title: "Balanced simulation",
    detail: "A realistic interview loop with breadth and follow-ups.",
  },
  HARD: {
    text: "text-rose-300",
    bg: "rgba(244, 63, 94, 0.12)",
    border: "rgba(244, 63, 94, 0.24)",
    glow: "rgba(244, 63, 94, 0.18)",
    title: "Pressure round",
    detail: "Sharper tradeoffs, deeper probing, stronger signal.",
  },
};

const QUICK_SIGNALS = [
  { label: "20-round target", value: "Structured mock" },
  { label: "Adaptive scoring", value: "Real-time feedback" },
  { label: "Custom focus", value: "Personalized prompts" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay },
});

const TARGET_ROUNDS = 20;

function getApiErrorMessage(err, fallback) {
  const detail = err?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || JSON.stringify(item)).join(", ");
  }

  if (detail && typeof detail === "object") {
    return detail.message || detail.error || JSON.stringify(detail);
  }

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (err?.response?.status === 429) {
    return "Daily interview/token limit reached. Try again tomorrow.";
  }

  return fallback;
}

function SetupPanel({ eyebrow, title, description, children, aside }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--surface-card)] p-5 shadow-[0_24px_80px_rgba(3,7,18,0.32)] sm:p-7">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "var(--panel-glow)",
        }}
      />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              {eyebrow}
            </p>
            <h2 className="mt-2 text-[26px] font-black tracking-[-0.03em] text-[var(--text-primary)]">
              {title}
            </h2>
            {description && (
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
                {description}
              </p>
            )}
          </div>
          {children}
        </div>
        {aside ? <div className="relative">{aside}</div> : null}
      </div>
    </div>
  );
}

function DifficultyCard({ level, active, onClick }) {
  const meta = LEVEL_META[level];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[24px] border p-5 text-left transition-all duration-200 ${
        active ? "translate-y-[-2px]" : "hover:-translate-y-1"
      }`}
      style={{
        background: active ? "var(--selected-bg)" : "var(--surface-soft)",
        borderColor: active ? "var(--selected-border)" : "var(--border)",
        boxShadow: active ? "0 18px 48px var(--selected-ring)" : "none",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${meta.text}`}>{level}</p>
          <h3 className="mt-2 text-lg font-bold text-[var(--text-primary)]">{meta.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{meta.detail}</p>
        </div>
        <span
          className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border text-[11px]"
          style={{
            borderColor: active ? "var(--selected-border)" : "var(--border)",
            background: active ? "var(--brand-gradient)" : "transparent",
            color: active ? "#fff" : "var(--text-primary)",
          }}
        >
          {active ? "●" : ""}
        </span>
      </div>
    </button>
  );
}

export default function InterviewSetupPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [jdId, setJdId] = useState(null);
  const [selectedJD, setSelectedJD] = useState(null);
  const [level, setLevel] = useState("MEDIUM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [candidatePreferences, setCandidatePreferences] = useState("");

  const userId = user?.id ? parseInt(user.id) : null;
  const selectedLevelMeta = LEVEL_META[level];
  const trimmedPreferences = candidatePreferences.trim();

  const startInterview = async () => {
    if (!jdId) return setError("Please select a Job Description.");
    if (!userId) return setError("User not found. Please login again.");

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/interview/start", {
        jd_id: jdId,
        level,
        user_id: userId,
        candidate_preferences: trimmedPreferences || null,
      });

      sessionStorage.setItem(
        "interviewSession",
        JSON.stringify({
          sessionId: res.data.session_id,
          roleTitle: res.data.role_title,
          level: res.data.level,
          firstQuestion: res.data.question,
          jdId,
          userId,
          startedAt: Date.now(),
          targetRounds: TARGET_ROUNDS,
          candidatePreferences: trimmedPreferences,
        })
      );

      router.push("/dashboard/interview/session");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not start interview."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-28 pt-[84px] sm:px-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <motion.section
            {...fadeUp(0)}
            className="theme-hero relative overflow-hidden rounded-[34px] border border-[var(--border-strong)] bg-[var(--surface-card)] px-6 py-7 shadow-[0_28px_90px_rgba(3,7,18,0.36)] sm:px-8 sm:py-9"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "var(--hero-surface)",
              }}
            />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200/80">
                  Interview Lab
                </p>
                <h1 className="mt-3 max-w-3xl text-[36px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[52px]">
                  Build an interview flow that actually feels like the real room.
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-200/80 sm:text-[16px]">
                  Choose the role, tune the pressure level, and tell the AI where to push harder. The setup stays fast,
                  but the mock feels focused and intentional.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {QUICK_SIGNALS.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Session Preview
                </p>
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {selectedJD?.role_title || "Pick a JD to load context"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Difficulty</p>
                    <p className={`mt-1 text-sm font-semibold ${selectedLevelMeta.text}`}>{selectedLevelMeta.title}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Focus cue</p>
                    <p className="mt-1 text-sm leading-6 text-slate-200/80">
                      {trimmedPreferences || "No extra guidance yet. The AI will use your selected role context."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                    <div className="rounded-2xl bg-white/6 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Target</p>
                      <p className="mt-1 text-base font-bold text-white">{TARGET_ROUNDS} rounds</p>
                    </div>
                    <div className="rounded-2xl bg-white/6 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Format</p>
                      <p className="mt-1 text-base font-bold text-white">Voice + text</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {error ? (
            <motion.div
              {...fadeUp(0.05)}
              className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
            >
              {error}
            </motion.div>
          ) : null}

          <motion.div {...fadeUp(0.1)}>
            <SetupPanel
              eyebrow="Step 1"
              title="Select the interview context"
              description="Use the JD that matches the role you want to practice for. This keeps the questions role-specific instead of generic."
              aside={
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Why this matters
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    Better JD context gives sharper follow-ups, more relevant technical prompts, and stronger scoring on
                    correctness and depth.
                  </p>
                </div>
              }
            >
              <JDSelector
                selectedId={jdId}
                onSelect={(nextId, jd) => {
                  setJdId(nextId);
                  setSelectedJD(jd || null);
                }}
                placeholder="No job descriptions found yet."
                title="Select the role you want to simulate"
                description="Use the same role context you prepared for in Resume Analysis so your mock interview stays consistent and realistic."
              />
            </SetupPanel>
          </motion.div>

          <motion.div {...fadeUp(0.14)}>
            <SetupPanel
              eyebrow="Step 2"
              title="Tell the interviewer where to push"
              description="Add your own guidance so the AI knows what to skip, what to stress-test, or what kind of role emphasis you want."
              aside={
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Example prompt
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    Ask fewer Python basics. Focus more on system design tradeoffs, debugging stories, and API scaling.
                  </p>
                </div>
              }
            >
              <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                <textarea
                  value={candidatePreferences}
                  onChange={(e) => setCandidatePreferences(e.target.value)}
                  rows={5}
                  placeholder="Share any custom instructions for the AI interviewer..."
                  className="min-h-[150px] w-full resize-none rounded-[22px] border border-transparent bg-transparent px-3 py-3 text-[15px] leading-7 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                />
                <div className="flex items-center justify-between border-t border-[var(--border)] px-3 pt-3">
                  <p className="text-xs text-[var(--text-muted)]">Optional, but useful if you want a sharper mock.</p>
                  <span className="text-xs font-medium text-[var(--text-muted)]">{candidatePreferences.length} chars</span>
                </div>
              </div>
            </SetupPanel>
          </motion.div>

          <motion.div {...fadeUp(0.18)}>
            <SetupPanel
              eyebrow="Step 3"
              title="Set the pressure level"
              description="Pick the difficulty that matches how tough you want the interviewer to be."
              aside={
                <div
                  className="rounded-[24px] border p-5"
                  style={{
                    borderColor: selectedLevelMeta.border,
                    background: selectedLevelMeta.bg,
                    boxShadow: `0 18px 48px ${selectedLevelMeta.glow}`,
                  }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Active mode
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-[var(--text-primary)]">{selectedLevelMeta.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{selectedLevelMeta.detail}</p>
                </div>
              }
            >
              <div className="grid gap-3 md:grid-cols-3">
                {LEVELS.map((item) => (
                  <DifficultyCard
                    key={item}
                    level={item}
                    active={level === item}
                    onClick={() => setLevel(item)}
                  />
                ))}
              </div>
            </SetupPanel>
          </motion.div>

          <motion.section
            {...fadeUp(0.22)}
            className="sticky bottom-4 z-10 overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--surface-card)] p-5 shadow-[0_28px_80px_rgba(3,7,18,0.3)] backdrop-blur sm:p-6"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(56,189,248,0.08), rgba(245,158,11,0.08) 55%, rgba(16,185,129,0.08))",
              }}
            />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid gap-3 sm:grid-cols-3 lg:flex lg:items-center lg:gap-3">
                <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Role</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                    {selectedJD?.role_title || "Select a JD"}
                  </p>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Difficulty</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{level}</p>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Guidance</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                    {trimmedPreferences ? "Personalized" : "Default"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={startInterview}
                disabled={loading || !jdId}
                className="inline-flex min-h-[58px] items-center justify-center rounded-[22px] px-6 text-base font-bold tracking-[0.01em] text-white transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  background: "var(--brand-gradient)",
                  boxShadow: "0 18px 50px rgba(125, 211, 252, 0.2)",
                }}
              >
                {loading
                  ? "Starting interview..."
                  : jdId
                    ? `Start ${selectedJD?.role_title || "Interview"}`
                    : "Select a JD to continue"}
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
