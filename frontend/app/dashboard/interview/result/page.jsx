"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import ProtectedRoute from "../../../../components/ProtectedRoute";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay },
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const TARGET_ROUNDS = 20;

const METRIC_META = {
  confidence: { label: "Confidence", accent: "#a78bfa" },
  correctness: { label: "Correctness", accent: "#4ade80" },
  depth: { label: "Depth", accent: "#38bdf8" },
  clarity: { label: "Clarity", accent: "#f59e0b" },
};

const LEVEL_COLOR = {
  EASY: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  MEDIUM: "text-sky-300 bg-sky-500/10 border-sky-500/20",
  HARD: "text-rose-300 bg-rose-500/10 border-rose-500/20",
};

const average = (items) => (items.length ? items.reduce((sum, item) => sum + item, 0) / items.length : 0);

function deriveLocalInsights(result) {
  const transcript = result.transcript || [];
  const scoredAnswers = transcript.filter((message) => message.role === "user" && message.score);
  const metricAverages = result.session_insights?.skill_scores || result.analytics?.metricAverages || {
    confidence: average(scoredAnswers.map((message) => message.score.confidence ?? 0)),
    correctness: average(scoredAnswers.map((message) => message.score.correctness)),
    depth: average(scoredAnswers.map((message) => message.score.depth)),
    clarity: average(scoredAnswers.map((message) => message.score.clarity)),
  };

  const strongestMetric = result.best_signal || result.session_insights?.best_signal
    || Object.entries(metricAverages).sort((a, b) => b[1] - a[1])[0]?.[0]
    || "correctness";
  const weakestMetric = result.session_insights?.weakest_signal
    || Object.entries(metricAverages).sort((a, b) => a[1] - b[1])[0]?.[0]
    || "depth";
  const momentumLabel = result.momentum || result.session_insights?.momentum || result.analytics?.momentumLabel || "Steady";
  const answeredCount = result.answeredCount ?? scoredAnswers.length;
  const targetRounds = result.targetRounds ?? result.session_insights?.target_rounds ?? TARGET_ROUNDS;
  const completionPct = clamp((answeredCount / targetRounds) * 100, 0, 100);
  const roundLabel = completionPct >= 100
    ? "Full simulation"
    : completionPct >= 60
      ? "Strong practice loop"
      : answeredCount > 0
        ? "Warm-up drill"
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
  const pct = Math.round((score / 10) * 100);
  const color = score >= 7 ? "#4ade80" : score >= 4 ? "#facc15" : "#f87171";
  const r = 48;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex items-center justify-center rounded-[28px] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <svg width="132" height="132" viewBox="0 0 132 132">
        <circle cx="66" cy="66" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle
          cx="66"
          cy="66"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x="66" y="62" textAnchor="middle" dominantBaseline="middle" style={{ fill: color, fontSize: 28, fontWeight: 800 }}>
          {score.toFixed(1)}
        </text>
        <text x="66" y="83" textAnchor="middle" style={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 600 }}>
          out of 10
        </text>
      </svg>
    </div>
  );
}

function Pill({ text, tone = "neutral" }) {
  const styles = {
    success: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    warn: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    info: "text-sky-300 bg-sky-500/10 border-sky-500/20",
    danger: "text-rose-300 bg-rose-500/10 border-rose-500/20",
    neutral: "text-[var(--text-primary)] bg-[var(--bg-secondary)] border-[var(--border)]",
  };

  return (
    <span className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold ${styles[tone]}`}>
      {text}
    </span>
  );
}

function StatCard({ label, value, helper, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5 transition-all duration-200 hover:-translate-y-1">
      <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ background: "radial-gradient(circle at top right, rgba(125,211,252,0.1), transparent 40%)" }} />
      <div className="relative">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-[30px] font-bold leading-none tracking-tight" style={{ color: accent || "var(--text-primary)" }}>
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{helper}</p>
      </div>
    </div>
  );
}

function SectionShell({ eyebrow, title, description, children }) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[0_24px_80px_rgba(3,7,18,0.24)] sm:p-7">
      <div className="absolute inset-0 opacity-80" style={{ background: "var(--panel-glow)" }} />
      <div className="relative mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{eyebrow}</p>
        <h2 className="mt-2 text-[26px] font-black tracking-[-0.03em] text-[var(--text-primary)]">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">{description}</p>
        ) : null}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

function MetricBar({ metric, value }) {
  const meta = METRIC_META[metric];
  const pct = clamp((value / 10) * 100, 0, 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[var(--text-primary)]">{meta.label}</span>
        <span className="text-sm font-semibold" style={{ color: meta.accent }}>
          {value.toFixed(1)}/10
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: meta.accent }} />
      </div>
    </div>
  );
}

function ExplainabilitySummary({ transcript }) {
  const explainedAnswers = transcript.filter((message) => message.role === "user" && message.evaluation);
  if (!explainedAnswers.length) return null;

  return (
    <SectionShell
      eyebrow="Explainability"
      title="See why the score moved the way it did"
      description="Recent answers with evaluator reasoning and sentence-level suggestions."
    >
      <div className="flex flex-col gap-4">
        {explainedAnswers.slice(-2).map((message, idx) => (
          <div key={idx} className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
            <p className="text-sm leading-7 text-[var(--text-primary)]">{message.evaluation.reasoning}</p>
            {message.evaluation.sentence_level_feedback?.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3">
                {message.evaluation.sentence_level_feedback.slice(0, 2).map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="rounded-[20px] border border-rose-500/20 bg-[var(--bg-card)] px-4 py-4"
                  >
                    <p className="text-[13px] italic leading-6 text-[var(--text-secondary)]">&ldquo;{item.sentence}&rdquo;</p>
                    <p className="mt-2 text-sm font-medium text-rose-300">{item.issue}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{item.suggestion}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function ConversationReview({ transcript }) {
  if (!transcript.length) return null;

  return (
    <SectionShell
      eyebrow="Conversation"
      title="Review the complete mock interview"
      description="Walk through every prompt and response with attached scoring context."
    >
      <div className="flex flex-col gap-4">
        {transcript.map((message, idx) => {
          const isAssistant = message.role === "assistant";
          return (
            <div
              key={idx}
              className="rounded-[24px] border border-[var(--border)] p-5"
              style={{ background: isAssistant ? "var(--bg-secondary)" : "var(--bg-card)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {isAssistant ? "Interviewer" : "You"}
                  </p>
                </div>
                {message.score ? (
                  <div className="flex flex-wrap gap-2">
                    <Pill text={`Conf ${message.score.confidence.toFixed(1)}`} tone="info" />
                    <Pill text={`Corr ${message.score.correctness.toFixed(1)}`} tone="success" />
                    <Pill text={`Depth ${message.score.depth.toFixed(1)}`} tone="warn" />
                    <Pill text={`Clarity ${message.score.clarity.toFixed(1)}`} tone="neutral" />
                  </div>
                ) : null}
              </div>

              <p className="mt-4 text-[15px] leading-7 text-[var(--text-primary)]">{message.content}</p>

              {message.evaluation ? (
                <div className="mt-4 rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Evaluation Context</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{message.evaluation.reasoning}</p>
                  {message.evaluation.sentence_level_feedback?.length > 0 ? (
                    <div className="mt-4 flex flex-col gap-3">
                      {message.evaluation.sentence_level_feedback.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="rounded-[18px] border border-rose-500/20 bg-[var(--bg-card)] px-4 py-4"
                        >
                          <p className="text-[13px] italic leading-6 text-[var(--text-secondary)]">&ldquo;{item.sentence}&rdquo;</p>
                          <p className="mt-2 text-sm font-medium text-rose-300">{item.issue}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{item.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

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

  const score = result.overall_score ?? 0;
  const scoreColor = score >= 7 ? "#4ade80" : score >= 4 ? "#facc15" : "#f87171";
  const verdict = score >= 7 ? "Strong Performance" : score >= 4 ? "Decent Attempt" : "Needs Improvement";
  const lc = LEVEL_COLOR[result.level] || LEVEL_COLOR.MEDIUM;
  const insights = deriveLocalInsights(result);
  const finishedLevel = result.finishedLevel || result.level;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-28 pt-[84px] sm:px-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <motion.section {...fadeUp(0)} className="theme-hero relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-7 shadow-[0_28px_90px_rgba(3,7,18,0.34)] sm:px-8 sm:py-9">
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
                    Interview Result
                  </p>
                <h1 className="mt-3 max-w-3xl text-[36px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[52px]">
                  {result.roleTitle || "Interview"}
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-200/80 sm:text-[16px]">
                    {result.summary || "Your full session breakdown is ready."}
                  </p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <span className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold ${lc}`}>
                    {result.level}
                  </span>
                    <Pill text={verdict} tone={score >= 7 ? "success" : score >= 4 ? "warn" : "danger"} />
                    <Pill text={insights.roundLabel} tone="info" />
                    <Pill text={`${insights.answeredCount} answers`} tone="neutral" />
                    <Pill text={`Ended on ${finishedLevel}`} tone="neutral" />
                  </div>
                </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">Overall Score</p>
                <div className="mt-5 flex justify-center">
                  <ScoreRing score={score} />
                </div>
                <p className="mt-4 text-center text-sm font-bold text-white">{verdict}</p>
              </div>
            </div>
          </motion.section>

          <motion.div {...fadeUp(0.05)} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Overall Score"
              value={score.toFixed(1)}
              helper="Your aggregate signal across correctness, clarity, confidence, and depth."
              accent={scoreColor}
            />
            <StatCard
              label="Momentum"
              value={insights.momentumLabel}
              helper="How your recent responses compared with the earlier part of the interview."
              accent="#38bdf8"
            />
            <StatCard
              label="Best Signal"
              value={METRIC_META[insights.strongestMetric].label}
              helper="The dimension that stayed strongest across your scored answers."
              accent={METRIC_META[insights.strongestMetric].accent}
            />
            <StatCard
              label="Session Time"
              value={result.durationMinutes ? `${result.durationMinutes} min` : "N/A"}
              helper="Longer loops usually expose deeper patterns, but short mocks still surface useful signal."
              accent="#f59e0b"
            />
          </motion.div>

          <motion.section {...fadeUp(0.1)}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
              <SectionShell
                eyebrow="Performance"
                title="Session DNA and scoring profile"
                description="This view mirrors the same analytics language used across the rest of the dashboard."
              >
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Session DNA
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-[var(--text-primary)]">{insights.sessionDna}</h3>
                    </div>
                    <Pill text={`${Math.round(insights.completionPct)}% complete`} tone="info" />
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-4">
                  {Object.keys(METRIC_META).map((metric) => (
                    <MetricBar key={metric} metric={metric} value={insights.metricAverages[metric]} />
                  ))}
                </div>
              </SectionShell>

              <SectionShell
                eyebrow="Gameplan"
                title={`Upgrade ${METRIC_META[insights.weakestMetric].label} first`}
                description="The clearest next move for your next mock."
              >
                <div
                  className="rounded-[24px] border border-[var(--border)] px-5 py-5"
                  style={{
                    background: "linear-gradient(135deg, rgba(56,189,248,0.08), rgba(245,158,11,0.08))",
                  }}
                >
                  <p className="text-[15px] leading-7 text-[var(--text-primary)]">{insights.nextMove}</p>
                </div>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Target Rounds
                    </p>
                    <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">{insights.targetRounds}</p>
                  </div>
                  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Completed
                    </p>
                    <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">{insights.answeredCount} answers</p>
                  </div>
                </div>
              </SectionShell>
            </div>
          </motion.section>

          {result.strengths?.length > 0 ? (
            <motion.div {...fadeUp(0.14)}>
              <SectionShell
                eyebrow="Strengths"
                title="What already worked well"
                description="The strongest patterns the evaluator noticed in your responses."
              >
                <div className="grid gap-3">
                  {result.strengths.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-[22px] border border-emerald-500/20 bg-emerald-500/8 px-4 py-4"
                    >
                      <span className="mt-0.5 text-sm font-bold text-emerald-300">✓</span>
                      <p className="text-[15px] leading-7 text-[var(--text-primary)]">{item}</p>
                    </div>
                  ))}
                </div>
              </SectionShell>
            </motion.div>
          ) : null}

          {result.improvements?.length > 0 ? (
            <motion.div {...fadeUp(0.18)}>
              <SectionShell
                eyebrow="Improvements"
                title="What to tighten before the next round"
                description="Specific areas that would move your score fastest."
              >
                <div className="grid gap-3">
                  {result.improvements.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-[22px] border border-amber-500/20 bg-amber-500/8 px-4 py-4"
                    >
                      <span className="mt-0.5 text-sm font-bold text-amber-300">→</span>
                      <p className="text-[15px] leading-7 text-[var(--text-primary)]">{item}</p>
                    </div>
                  ))}
                </div>
              </SectionShell>
            </motion.div>
          ) : null}

          <motion.div {...fadeUp(0.22)}>
            <ExplainabilitySummary transcript={result.transcript || []} />
          </motion.div>

          <motion.div {...fadeUp(0.26)}>
            <ConversationReview transcript={result.transcript || []} />
          </motion.div>

          <motion.div {...fadeUp(0.3)} className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/interview"
              className="inline-flex min-h-[52px] items-center justify-center rounded-[20px] px-5 text-sm font-bold text-white no-underline transition-all"
              style={{ background: "var(--brand-gradient)" }}
            >
              Start New Interview
            </Link>
            <Link
              href="/dashboard/interview/recording"
              className="inline-flex min-h-[52px] items-center justify-center rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] px-5 text-sm font-bold text-[var(--text-primary)] no-underline transition-all"
            >
              Review Recording
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-[52px] items-center justify-center rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] px-5 text-sm font-bold text-[var(--text-primary)] no-underline transition-all"
            >
              Dashboard
            </Link>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
