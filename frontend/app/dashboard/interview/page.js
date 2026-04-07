"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/axios";
import { useAuth } from "../../../context/AuthContext";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { motion } from "framer-motion";
import JDSelector from "../../../components/JDSelector";

const LEVELS = ["EASY", "MEDIUM", "HARD"];
const LEVEL_COLOR = {
  EASY:   { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  MEDIUM: { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  HARD:   { text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20" },
};

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16, filter: "blur(4px)" },
  animate:    { opacity: 1, y: 0,  filter: "blur(0px)" },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay },
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

export default function InterviewSetupPage() {
  const router   = useRouter();
  const { user } = useAuth();

  const [jdId,      setJdId]      = useState(null);
  const [selectedJD, setSelectedJD] = useState(null);
  const [level,     setLevel]     = useState("MEDIUM");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [candidatePreferences, setCandidatePreferences] = useState("");

  const userId = user?.id ? parseInt(user.id) : null;

  const startInterview = async () => {
    if (!jdId)   return setError("Please select a Job Description.");
    if (!userId) return setError("User not found. Please login again.");
    setLoading(true); setError(null);
    try {
      const res = await api.post("/interview/start", {
        jd_id:   jdId,
        level,
        user_id: userId,
        candidate_preferences: candidatePreferences.trim() || null,
      });
      sessionStorage.setItem("interviewSession", JSON.stringify({
        sessionId:     res.data.session_id,
        roleTitle:     res.data.role_title,
        level:         res.data.level,
        firstQuestion: res.data.question,
        jdId,
        userId,
        startedAt:     Date.now(),
        targetRounds:  TARGET_ROUNDS,
        candidatePreferences: candidatePreferences.trim(),
      }));
      router.push("/dashboard/interview/session");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not start interview."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-32 pt-[80px] sm:px-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:gap-10">

          {/* ── HERO ── */}
          <motion.div {...fadeUp(0)} className="pt-12 flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-primary)]">
              Interview Setup
            </p>
            <h1 className="text-[34px] font-extrabold leading-[1.02] tracking-tight text-[var(--text-primary)] sm:text-[44px]">
              Ready to practice?
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--text-primary)] sm:text-[17px]">
              Pick a job description and difficulty. The AI will ask role-specific
              questions and score your answers in real time.
            </p>
          </motion.div>

          {/* ── ERROR ── */}
          {error && (
          <motion.div
              {...fadeUp(0)}
              className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-400"
          >
              ⚠ {error}
            </motion.div>
          )}

          {/* ── STEP 1 — JD ── */}
          <motion.div {...fadeUp(0.1)} className="flex flex-col gap-4">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                Step 1
              </p>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Select a Job Description
              </h2>
            </div>
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
          </motion.div>

          <motion.div {...fadeUp(0.16)} className="flex flex-col gap-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                Step 2
              </p>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Add Interview Guidance
              </h2>
              <p className="mt-2 text-base leading-7 text-[var(--text-primary)]">
                Share what you already know well or what you want more focus on. Example: I know Python well, ask fewer Python questions and focus more on system design.
              </p>
            </div>
            <textarea
              value={candidatePreferences}
              onChange={(e) => setCandidatePreferences(e.target.value)}
              rows={4}
              placeholder="Add any interview instructions for the AI interviewer..."
              className="w-full resize-none rounded-[26px] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 text-base text-[var(--text-primary)] outline-none sm:px-5"
            />
          </motion.div>

          {/* ── STEP 3 — DIFFICULTY ── */}
          <motion.div {...fadeUp(0.18)} className="flex flex-col gap-4">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                Step 3
              </p>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Choose Difficulty
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {LEVELS.map(l => {
                const c      = LEVEL_COLOR[l];
                const active = level === l;
                return (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`rounded-[22px] border py-4 text-base font-bold tracking-wide transition-all duration-200 ${
                      active ? `${c.bg} ${c.border} ${c.text}` : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                    }`}>
                    {l}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* ── START ── */}
          <motion.div {...fadeUp(0.24)}>
            <button
              onClick={startInterview}
              disabled={loading || !jdId}
              className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-[var(--text-primary)] py-4 text-base font-bold tracking-wide text-[var(--bg-primary)] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-[var(--bg-primary)]" />
                  Starting…
                </>
              ) : jdId ? (
                `Start Interview - ${selectedJD?.role_title || "Selected JD"}`
              ) : (
                "Select a JD to continue"
              )}
            </button>
          </motion.div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
