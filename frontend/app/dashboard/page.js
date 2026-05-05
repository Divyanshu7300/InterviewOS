"use client";

import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../lib/axios";

const Icon = ({ d, size = 14 }) => (
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
  interview: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  resume: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6M9 9h2",
  community: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",
  learn: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  arrow: "M5 12h14M12 5l7 7-7 7",
  xp: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  streak: "M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.23.1-.47.04-.66-.12a.58.58 0 01-.14-.17c-1.13-1.43-1.31-3.48-.55-5.12C5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5.14.6.41 1.2.71 1.73 1.08 1.73 2.95 2.97 4.96 3.22 2.14.27 4.43-.12 6.07-1.6 1.83-1.66 2.47-4.32 1.53-6.6l-.13-.26c-.21-.46-.77-1.26-.77-1.26z",
  trophy: "M8 21h8M12 17v4M17 3H7l-2 7c0 2.76 2.24 5 5 5s5-2.24 5-5L17 3zM5 8H2M19 8h3",
};

const quotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it is done.", author: "Nelson Mandela" },
  { text: "Do not watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Believe you can and you are halfway there.", author: "Theodore Roosevelt" },
  { text: "Hard work beats talent when talent does not work hard.", author: "Tim Notke" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
];

const overviewStats = [
  { label: "Resumes", key: "total_resumes", icon: "resume", text: "text-rose-300", bg: "rgba(244, 63, 94, 0.12)", border: "rgba(244, 63, 94, 0.24)" },
  { label: "JDs", key: "total_jds", icon: "jd", text: "text-sky-300", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.24)" },
  { label: "Interviews", key: "total_interviews", icon: "interview", text: "text-emerald-300", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.22)" },
  { label: "Comments", key: "total_comments", icon: "community", text: "text-violet-300", bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.24)" },
];

const quickActions = [
  {
    href: "/dashboard/jd",
    title: "Analyze JD",
    desc: "Extract role signals.",
    icon: "jd",
    cta: "Start analysis",
    text: "text-sky-300",
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.24)",
  },
  {
    href: "/dashboard/resume",
    title: "Resume Analysis",
    desc: "Check fit and gaps.",
    icon: "resume",
    cta: "Review fit",
    text: "text-rose-300",
    bg: "rgba(244, 63, 94, 0.12)",
    border: "rgba(244, 63, 94, 0.24)",
  },
  {
    href: "/dashboard/interview",
    title: "AI Interview",
    desc: "Run a focused mock.",
    icon: "interview",
    cta: "Open lab",
    text: "text-emerald-300",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.22)",
  },
  {
    href: "/dashboard/learn",
    title: "Learn",
    desc: "Practice weak areas.",
    icon: "learn",
    cta: "Start learning",
    text: "text-amber-300",
    bg: "rgba(251, 191, 36, 0.12)",
    border: "rgba(251, 191, 36, 0.24)",
  },
  {
    href: "/dashboard/community",
    title: "Community",
    desc: "Ask and discuss.",
    icon: "community",
    cta: "Join threads",
    text: "text-violet-300",
    bg: "rgba(167, 139, 250, 0.12)",
    border: "rgba(167, 139, 250, 0.24)",
  },
  {
    href: "/dashboard/learn/stats",
    title: "My Progress",
    desc: "Review XP and streaks.",
    icon: "trophy",
    cta: "View stats",
    text: "text-orange-300",
    bg: "rgba(251, 146, 60, 0.12)",
    border: "rgba(251, 146, 60, 0.24)",
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay },
});

function DashboardPanel({ eyebrow, title, description, children, aside }) {
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

function MetricCard({ icon, value, label, loading, text, bg, border }) {
  return (
    <div
      className="group relative overflow-hidden rounded-[24px] border p-5 transition-all duration-200 hover:-translate-y-1"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at top right, ${bg}, transparent 40%)` }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[16px] border ${text}`}
          style={{ background: bg, borderColor: border }}
        >
          <Icon d={icons[icon]} size={17} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {label}
        </span>
      </div>
      <p className="relative mt-6 text-[30px] font-black leading-none tracking-[-0.03em] text-[var(--text-primary)]">
        {loading ? "-" : value}
      </p>
    </div>
  );
}

function ActionCard({ action }) {
  return (
    <Link
      href={action.href}
      className="group relative overflow-hidden rounded-[24px] border p-5 text-left no-underline transition-all duration-200 hover:-translate-y-1"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at top right, ${action.bg}, transparent 38%)` }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[16px] border ${action.text}`}
          style={{ background: action.bg, borderColor: action.border }}
        >
          <Icon d={icons[action.icon]} size={17} />
        </div>
        <span className="text-[var(--text-primary)] opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-80">
          <Icon d={icons.arrow} size={14} />
        </span>
      </div>
      <h3 className="relative mt-5 text-lg font-bold text-[var(--text-primary)]">{action.title}</h3>
      <p className="relative mt-2 text-sm leading-6 text-[var(--text-secondary)]">{action.desc}</p>
      <div className="relative mt-5 border-t border-[var(--border)] pt-4">
        <span className={`text-sm font-bold ${action.text}`}>{action.cta}</span>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth() ?? {};

  const displayName = user?.username
    ? `@${user.username}`
    : user?.email
      ? user.email.split("@")[0].split(/[._-]/)[0].replace(/^\w/, (c) => c.toUpperCase())
      : "there";

  const userId = user?.id ? parseInt(user.id) : null;

  const [dashStats, setDashStats] = useState(null);
  const [learnStats, setLearnStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const quote = quotes[new Date().getDate() % quotes.length];

  useEffect(() => {
    if (!userId) return;

    Promise.allSettled([
      api.get(`/dashboard/users/${userId}/stats`),
      api.get(`/learn/users/${userId}/stats`),
    ])
      .then(([dashRes, learnRes]) => {
        if (dashRes.status === "fulfilled") setDashStats(dashRes.value.data);
        if (learnRes.status === "fulfilled") setLearnStats(learnRes.value.data);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const overview = dashStats?.overview ?? {};
  const totalXp = learnStats?.total_xp ?? 0;
  const level = Math.floor(totalXp / 1000) + 1;
  const xpInLevel = totalXp % 1000;
  const xpPct = (xpInLevel / 1000) * 100;
  const streak = learnStats?.current_streak ?? 0;
  const topicsCompleted = learnStats?.topics_completed ?? 0;

  const heroStats = [
    { label: "Level", value: level },
    { label: "Total XP", value: loading ? "-" : totalXp.toLocaleString() },
    { label: "Streak", value: loading ? "-" : `${streak} days` },
    { label: "Topics", value: loading ? "-" : topicsCompleted },
  ];

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
                  Dashboard
                </p>
                <h1 className="mt-3 max-w-3xl text-[36px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[52px]">
                  Hey, {displayName}. Your prep command center is live.
                </h1>
                <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-200/80 sm:text-[16px]">
                  See your progress and jump straight into the next prep action.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {[
                    { value: "Role-first flow" },
                    { value: "XP + streaks" },
                  ].map((item) => (
                    <div
                      key={item.value}
                      className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur"
                    >
                      <p className="text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Progress Preview
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {heroStats.slice(0, 2).map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white/6 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                      <p className="mt-1 text-base font-bold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Account</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-200/85">{user?.email || "Signed in"}</p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.div {...fadeUp(0.08)}>
            <DashboardPanel
              eyebrow="Overview"
              title="Activity at a glance"
              aside={
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Today
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">&ldquo;{quote.text}&rdquo;</p>
                </div>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {overviewStats.map((item) => (
                  <MetricCard
                    key={item.label}
                    icon={item.icon}
                    value={overview[item.key] ?? 0}
                    label={item.label}
                    loading={loading}
                    text={item.text}
                    bg={item.bg}
                    border={item.border}
                  />
                ))}
              </div>
            </DashboardPanel>
          </motion.div>

          <motion.div {...fadeUp(0.14)}>
            <DashboardPanel
              eyebrow="Learning Momentum"
              title="Learning momentum"
              aside={
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Current level
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-[var(--text-primary)]">Level {level}</h3>
                </div>
              }
            >
              <div className="rounded-[26px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-amber-300/25 bg-amber-400/10 text-amber-300">
                      <Icon d={icons.xp} size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">Level {level}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{xpInLevel} / 1000 XP this level</p>
                    </div>
                  </div>
                  <p className="text-2xl font-black tracking-[-0.03em] text-[var(--text-primary)]">
                    {loading ? "-" : totalXp.toLocaleString()} XP
                  </p>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--border)]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--brand-gradient-strong)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Day Streak", value: streak, icon: "streak", text: "text-orange-300", bg: "rgba(251, 146, 60, 0.12)", border: "rgba(251, 146, 60, 0.24)" },
                  { label: "Topics Done", value: topicsCompleted, icon: "trophy", text: "text-violet-300", bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.24)" },
                ].map((item) => (
                  <MetricCard
                    key={item.label}
                    icon={item.icon}
                    value={item.value}
                    label={item.label}
                    loading={loading}
                    text={item.text}
                    bg={item.bg}
                    border={item.border}
                  />
                ))}
              </div>
            </DashboardPanel>
          </motion.div>

          <motion.div {...fadeUp(0.2)}>
            <DashboardPanel
              eyebrow="Quick Actions"
              title="Choose the next move"
              aside={
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Suggested path
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    JD first, resume second, mock third.
                  </p>
                </div>
              }
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {quickActions.map((action) => (
                  <ActionCard key={action.href} action={action} />
                ))}
              </div>
            </DashboardPanel>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
