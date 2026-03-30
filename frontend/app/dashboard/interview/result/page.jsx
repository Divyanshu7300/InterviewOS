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

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const METRIC_META = {
  confidence: { label: "Confidence", accent: "#a78bfa" },
  correctness: { label: "Correctness", accent: "#4ade80" },
  depth: { label: "Depth", accent: "#38bdf8" },
  clarity: { label: "Clarity", accent: "#f59e0b" },
};

const average = (items) => items.length ? items.reduce((sum, item) => sum + item, 0) / items.length : 0;

function deriveLocalInsights(result) {
  const transcript = result.transcript || [];
  const scoredAnswers = transcript.filter(message => message.role === "user" && message.score);
  const metricAverages = result.session_insights?.skill_scores || result.analytics?.metricAverages || {
    confidence: average(scoredAnswers.map(message => message.score.confidence ?? 0)),
    correctness: average(scoredAnswers.map(message => message.score.correctness)),
    depth: average(scoredAnswers.map(message => message.score.depth)),
    clarity: average(scoredAnswers.map(message => message.score.clarity)),
  };
  const strongestMetric = result.best_signal || result.session_insights?.best_signal
    || Object.entries(metricAverages).sort((a, b) => b[1] - a[1])[0]?.[0] || "correctness";
  const weakestMetric = result.session_insights?.weakest_signal
    || Object.entries(metricAverages).sort((a, b) => a[1] - b[1])[0]?.[0] || "depth";
  const momentumLabel = result.momentum || result.session_insights?.momentum || result.analytics?.momentumLabel || "Steady";
  const answeredCount = result.answeredCount ?? scoredAnswers.length;
  const targetRounds = result.targetRounds ?? 5;
  const completionPct = clamp((answeredCount / targetRounds) * 100, 0, 100);
  const roundLabel = completionPct >= 100 ? "Full simulation"
    : completionPct >= 60 ? "Strong practice loop"
    : answeredCount > 0 ? "Warm-up drill"
    : "Short session";
  const nextMove = weakestMetric === "depth"
    ? "Push one more layer with tradeoffs, scale, or failure handling."
    : weakestMetric === "clarity"
      ? "Lead with structure: answer, reason, example, takeaway."
      : "Slow down and anchor claims in precise technical choices.";

  return {
    metricAverages,
    strongestMetric,
    weakestMetric,
    momentumLabel,
    answeredCount,
    targetRounds,
    completionPct,
    roundLabel,
    nextMove,
    sessionDna: result.session_dna || result.session_insights?.session_dna || "Adaptive learner",
  };
}

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
          style={{ fill: "var(--text-primary)", fontSize: 9 }}>
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

function InsightCard({ label, value, helper, accent }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]">
        {label}
      </p>
      <p className="text-[18px] font-bold mt-2" style={{ color: accent || "var(--text-primary)" }}>
        {value}
      </p>
      <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "var(--text-primary)" }}>
        {helper}
      </p>
    </div>
  );
}

function MetricBar({ metric, value }) {
  const meta = METRIC_META[metric];
  const pct = clamp((value / 10) * 100, 0, 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
          {meta.label}
        </span>
        <span className="text-sm font-semibold" style={{ color: meta.accent }}>
          {value.toFixed(1)}/10
        </span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: meta.accent }} />
      </div>
    </div>
  );
}

function ExplainabilitySummary({ transcript }) {
  const explainedAnswers = transcript.filter(message => message.role === "user" && message.evaluation);
  if (!explainedAnswers.length) return null;

  return (
    <div className="rounded-2xl p-6 border"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em]"
        style={{ color: "var(--text-primary)" }}>
        Score Explainability
      </p>
      <div className="flex flex-col gap-4">
        {explainedAnswers.slice(-2).map((message, idx) => (
          <div key={idx} className="rounded-xl border p-4"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
            <p className="text-[12px] font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {message.evaluation.reasoning}
            </p>
            {message.evaluation.sentence_level_feedback?.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {message.evaluation.sentence_level_feedback.slice(0, 2).map((item, itemIdx) => (
                  <div key={itemIdx} className="rounded-lg px-3 py-2 border"
                    style={{ background: "var(--bg-card)", borderColor: "rgba(248,113,113,0.16)" }}>
                    <p className="text-[12px] italic" style={{ color: "var(--text-primary)" }}>
                      &ldquo;{item.sentence}&rdquo;
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "#f87171" }}>
                      {item.issue}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-primary)" }}>
                      {item.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConversationReview({ transcript }) {
  if (!transcript.length) return null;

  return (
    <div className="rounded-2xl p-6 border"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--text-primary)" }}>
          Full Conversation
        </p>
        <h2 className="text-lg font-bold mt-1" style={{ color: "var(--text-primary)" }}>
          Review the complete practice interview
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {transcript.map((message, idx) => {
          const isAssistant = message.role === "assistant";
          return (
            <div key={idx} className="rounded-xl border p-4"
              style={{ background: isAssistant ? "var(--bg-secondary)" : "var(--bg-card)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "var(--text-primary)" }}>
                  {isAssistant ? "Interviewer" : "You"}
                </p>
                {message.score && (
                  <div className="flex gap-1.5 flex-wrap">
                    <Tag text={`Conf ${message.score.confidence.toFixed(1)}`} color="amber" />
                    <Tag text={`Corr ${message.score.correctness.toFixed(1)}`} color="green" />
                    <Tag text={`Depth ${message.score.depth.toFixed(1)}`} color="red" />
                    <Tag text={`Clarity ${message.score.clarity.toFixed(1)}`} color="amber" />
                  </div>
                )}
              </div>

              <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {message.content}
              </p>

              {message.evaluation && (
                <div className="mt-3 rounded-lg border px-4 py-3"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                  <p className="mb-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Evaluation Context
                  </p>
                  <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
                    {message.evaluation.reasoning}
                  </p>
                  {message.evaluation.sentence_level_feedback?.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {message.evaluation.sentence_level_feedback.map((item, itemIdx) => (
                        <div key={itemIdx} className="rounded-lg border px-3 py-2"
                          style={{ background: "var(--bg-card)", borderColor: "rgba(248,113,113,0.16)" }}>
                          <p className="text-[12px] italic" style={{ color: "var(--text-primary)" }}>
                            &ldquo;{item.sentence}&rdquo;
                          </p>
                          <p className="mt-1 text-sm" style={{ color: "#f87171" }}>
                            {item.issue}
                          </p>
                          <p className="mt-1 text-sm" style={{ color: "var(--text-primary)" }}>
                            {item.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const LEVEL_COLOR = {
  EASY:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  HARD:   "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function InterviewResultPage() {
  const router = useRouter();
  const [result] = useState(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("interviewResult");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (!result) router.push("/dashboard/interview");
  }, [result, router]);

  if (!result) return null;

  const score     = result.overall_score ?? 0;
  const scoreColor = score >= 7 ? "#4ade80" : score >= 4 ? "#facc15" : "#f87171";
  const verdict   = score >= 7 ? "Strong Performance" : score >= 4 ? "Decent Attempt" : "Needs Improvement";
  const lc        = LEVEL_COLOR[result.level] || LEVEL_COLOR.MEDIUM;
  const insights  = deriveLocalInsights(result);
  const finishedLevel = result.finishedLevel || result.level;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] pb-32 pt-[72px]">
        <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5">

          {/* ── HERO ── */}
          <motion.div {...fadeUp(0)} className="pt-12 flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-primary)]">
              Interview Complete
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[36px] font-extrabold leading-[1.08] tracking-tight text-[var(--text-primary)]">
                {result.roleTitle || "Interview"}
              </h1>
              <span className={`rounded-full border px-2.5 py-1 text-sm font-semibold ${lc}`}>
                {result.level}
              </span>
            </div>
            <p className="text-[16px] text-[var(--text-primary)]">
              Here is how you performed in this session.
            </p>
          </motion.div>

          {/* ── SCORE CARD ── */}
          <motion.div {...fadeUp(0.08)}
            className="flex items-center gap-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <ScoreRing score={score} />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--text-primary)" }}>
                Overall Score
              </p>
              <p className="text-2xl font-extrabold" style={{ color: scoreColor }}>
                {verdict}
              </p>
              <p className="text-[15px] leading-7 max-w-sm"
                style={{ color: "var(--text-primary)" }}>
                {result.summary}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Tag text={insights.roundLabel} color="green" />
                <Tag text={`${insights.answeredCount} answers`} color="amber" />
                <Tag text={`Ended on ${finishedLevel}`} color="red" />
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.12)} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InsightCard
              label="Momentum"
              value={insights.momentumLabel}
              helper="This reflects how your last responses compared with your earlier ones."
              accent="#38bdf8"
            />
            <InsightCard
              label="Best Signal"
              value={METRIC_META[insights.strongestMetric].label}
              helper="This was the most consistently strong part of your interview answers."
              accent={METRIC_META[insights.strongestMetric].accent}
            />
            <InsightCard
              label="Session Time"
              value={result.durationMinutes ? `${result.durationMinutes} min` : "N/A"}
              helper="A quick mock still gives signal, but longer loops usually expose deeper gaps."
              accent="#f59e0b"
            />
          </motion.div>

          <motion.div {...fadeUp(0.14)}
            className="rounded-2xl p-6 border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-1"
                  style={{ color: "var(--text-primary)" }}>
                  Session DNA
                </p>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {insights.sessionDna}
                </h2>
              </div>
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full border"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                {Math.round(insights.completionPct)}% complete
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {Object.keys(METRIC_META).map(metric => (
                <MetricBar key={metric} metric={metric} value={insights.metricAverages[metric]} />
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.16)}>
            <ExplainabilitySummary transcript={result.transcript || []} />
          </motion.div>

          <motion.div {...fadeUp(0.18)}>
            <ConversationReview transcript={result.transcript || []} />
          </motion.div>

          {/* ── STRENGTHS ── */}
          {result.strengths?.length > 0 && (
            <motion.div {...fadeUp(0.14)}
              className="rounded-2xl p-6 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}>
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
                style={{ color: "var(--text-primary)" }}>
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

          <motion.div {...fadeUp(0.2)}
            className="rounded-2xl p-6 border"
            style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.08), rgba(245,158,11,0.08))", borderColor: "var(--border)" }}>
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}>
              Next Round Gameplan
            </p>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              Upgrade {METRIC_META[insights.weakestMetric].label} first
            </h2>
            <p className="text-[15px] leading-7"
              style={{ color: "var(--text-primary)" }}>
              {insights.nextMove}
            </p>
          </motion.div>

          {/* ── ACTIONS ── */}
          <motion.div {...fadeUp(0.22)} className="flex gap-3 flex-wrap">
            <Link href="/dashboard/interview"
              className="flex-1 py-3 rounded-xl text-sm font-bold text-center no-underline transition-all active:scale-[0.98]"
              style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
              Start New Interview →
            </Link>
            <Link href="/dashboard/interview/recording"
              className="px-5 py-3 rounded-xl text-sm font-medium text-center no-underline border transition-all"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-card)" }}>
              Review Recording
            </Link>
            <Link href="/dashboard"
              className="px-5 py-3 rounded-xl text-sm font-medium text-center no-underline border transition-all"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-card)" }}>
              Dashboard
            </Link>
          </motion.div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
