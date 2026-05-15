"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { motion } from "framer-motion";

const Icon = ({ d, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const icons = {
  jd: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  resume: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6M9 9h2",
  interview: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  learn: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  community: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",
  arrow: "M5 12h14M12 5l7 7-7 7",
};

const QUICK_SIGNALS = [
  { label: "Prep loop", value: "JD to interview" },
  { label: "Feedback", value: "Scores + gaps" },
  { label: "Momentum", value: "Learn + community" },
];

const features = [
  {
    step: "01",
    icon: icons.jd,
    label: "JD Analysis",
    title: "Decode the role first",
    desc: "Extract the stack, signals, and likely interview topics.",
    bullets: ["Stack", "Signals", "Topics"],
    href: "/dashboard/jd",
    cta: "Analyze JD",
    text: "text-sky-300",
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.24)",
    glow: "rgba(56, 189, 248, 0.16)",
  },
  {
    step: "02",
    icon: icons.resume,
    label: "Resume Match",
    title: "Check your fit for the JD",
    desc: "See ATS fit, matched skills, and missing keywords.",
    bullets: ["ATS", "Gaps", "Fixes"],
    href: "/dashboard/resume",
    cta: "Review Resume",
    text: "text-rose-300",
    bg: "rgba(244, 63, 94, 0.12)",
    border: "rgba(244, 63, 94, 0.24)",
    glow: "rgba(244, 63, 94, 0.14)",
  },
  {
    step: "03",
    icon: icons.interview,
    label: "AI Interview",
    title: "Practice the real room",
    desc: "Practice with role prompts, follow-ups, and scoring.",
    bullets: ["Prompts", "Scoring", "Feedback"],
    href: "/dashboard/interview",
    cta: "Start Interview",
    text: "text-emerald-300",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.22)",
    glow: "rgba(16, 185, 129, 0.16)",
  },
  {
    step: "04",
    icon: icons.learn,
    label: "Skill Learning",
    title: "Build the missing skills",
    desc: "Use quizzes and XP to close skill gaps.",
    bullets: ["Quizzes", "XP", "Streaks"],
    href: "/dashboard/learn",
    cta: "Start Learning",
    text: "text-amber-300",
    bg: "rgba(251, 191, 36, 0.12)",
    border: "rgba(251, 191, 36, 0.24)",
    glow: "rgba(251, 191, 36, 0.15)",
  },
  {
    step: "05",
    icon: icons.community,
    label: "Community",
    title: "Learn with other candidates",
    desc: "Ask questions and learn from shared prep stories.",
    bullets: ["Threads", "Replies", "Stories"],
    href: "/dashboard/community",
    cta: "Open Community",
    text: "text-violet-300",
    bg: "rgba(167, 139, 250, 0.12)",
    border: "rgba(167, 139, 250, 0.24)",
    glow: "rgba(167, 139, 250, 0.14)",
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay },
});

function PrepPanel({ eyebrow, title, description, children, aside }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[0_24px_80px_rgba(3,7,18,0.24)] sm:p-7">
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
            {description ? (
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
                {description}
              </p>
            ) : null}
          </div>
          {children}
        </div>
        {aside ? <div className="relative">{aside}</div> : null}
      </div>
    </div>
  );
}

function FeatureCard({ feature }) {
  return (
    <Link
      href={feature.href}
      className="group relative overflow-hidden rounded-[24px] border p-5 text-left no-underline transition-all duration-200 hover:-translate-y-1"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at top right, ${feature.bg}, transparent 36%)`,
        }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-[var(--border)] bg-[var(--bg-card)] text-[11px] font-bold text-[var(--text-primary)]">
            {feature.step}
          </span>
          <span
            className={`rounded-[14px] border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] ${feature.text}`}
            style={{ background: feature.bg, borderColor: feature.border }}
          >
            {feature.label}
          </span>
        </div>
        <span className={`${feature.text} opacity-45 transition-opacity group-hover:opacity-80`}>
          <Icon d={feature.icon} size={18} />
        </span>
      </div>

      <div className="relative mt-5">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">{feature.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {feature.desc}
        </p>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {feature.bullets.map((bullet) => (
          <span
            key={bullet}
            className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-primary)]"
          >
            {bullet}
          </span>
        ))}
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
        <span className={`text-sm font-bold ${feature.text}`}>{feature.cta}</span>
        <span className="text-[var(--text-primary)] opacity-60 transition-transform group-hover:translate-x-1">
          <Icon d={icons.arrow} size={14} />
        </span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { user } = useAuth() ?? {};

  const displayName = user?.username
    ? `@${user.username}`
    : user?.email?.split("@")[0] ?? "there";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-28 pt-[84px] sm:px-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <motion.section
            {...fadeUp(0)}
            className="theme-hero relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-7 shadow-[0_28px_90px_rgba(3,7,18,0.34)] sm:px-8 sm:py-9"
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
                  Welcome, {displayName}
                </p>
                <h1 className="mt-3 max-w-3xl text-[36px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[52px]">
                  Your interview prep workspace is ready.
                </h1>
                <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-200/80 sm:text-[16px]">
                  A focused place to move from role analysis to resume fit, mock practice, and learning.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {QUICK_SIGNALS.slice(0, 2).map((item) => (
                    <span key={item.label} className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white backdrop-blur">
                      {item.value}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Recommended Start
                </p>
                <div className="mt-5 space-y-3">
                  <p className="text-lg font-bold text-white">Analyze a job description</p>
                  <p className="text-sm leading-6 text-slate-200/80">Use that same role context everywhere else.</p>
                  <Link
                    href="/dashboard/jd"
                    className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[20px] px-5 text-sm font-bold text-white no-underline transition-all duration-200 active:scale-[0.99]"
                    style={{
                      background: "var(--brand-gradient)",
                      boxShadow: "0 18px 50px rgba(125, 211, 252, 0.2)",
                    }}
                  >
                    Start with JD Analysis
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.div {...fadeUp(0.1)}>
            <PrepPanel
              eyebrow="Prep Workflow"
              title="Pick the next step"
              aside={
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Best path
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    Start with JD Analysis, then reuse that context.
                  </p>
                </div>
              }
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {features.slice(0, 3).map((feature) => (
                  <FeatureCard key={feature.step} feature={feature} />
                ))}
              </div>
            </PrepPanel>
          </motion.div>

          <motion.div {...fadeUp(0.16)}>
            <PrepPanel
              eyebrow="Keep Improving"
              title="Close the remaining gaps"
              aside={
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Momentum cue
                  </p>
                  <h3 className="mt-3 text-[var(--text-primary)]">Fix one gap at a time</h3>
                </div>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                {features.slice(3).map((feature) => (
                  <FeatureCard key={feature.step} feature={feature} />
                ))}
              </div>
            </PrepPanel>
          </motion.div>

          <motion.section
            {...fadeUp(0.22)}
            className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[0_28px_80px_rgba(3,7,18,0.24)] sm:p-6"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(56,189,248,0.08), rgba(245,158,11,0.08) 55%, rgba(16,185,129,0.08))",
              }}
            />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Ready for a mock?
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--text-primary)]">
                  Jump into the Interview Lab
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] px-5 text-sm font-bold text-[var(--text-primary)] no-underline"
                >
                  View Dashboard
                </Link>
                <Link
                  href="/dashboard/interview"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-[20px] px-5 text-sm font-bold text-white no-underline"
                  style={{
                    background: "var(--brand-gradient)",
                    boxShadow: "0 18px 50px rgba(125, 211, 252, 0.18)",
                  }}
                >
                  Start Interview
                </Link>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
