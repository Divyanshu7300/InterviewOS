"use client";

import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../lib/axios";

const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  jd:        "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2",
  interview: "M8 10h.01M12 10h.01M16 10h.01M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  resume:    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z",
  community: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  learn:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  arrow:     "M5 12h14M12 5l7 7-7 7",
  xp:        "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  streak:    "M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.23.1-.47.04-.66-.12a.58.58 0 01-.14-.17c-1.13-1.43-1.31-3.48-.55-5.12C5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5.14.6.41 1.2.71 1.73 1.08 1.73 2.95 2.97 4.96 3.22 2.14.27 4.43-.12 6.07-1.6 1.83-1.66 2.47-4.32 1.53-6.6l-.13-.26c-.21-.46-.77-1.26-.77-1.26z",
  trophy:    "M8 21h8M12 17v4M17 3H7l-2 7c0 2.76 2.24 5 5 5s5-2.24 5-5L17 3zM5 8H2M19 8h3",
};

const quotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
];

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1], delay },
});

function StatCard({ icon, value, label, loading, accent }) {
  return (
    <div className="rounded-2xl p-5 border flex flex-col gap-3"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div style={{ color: accent || "var(--text-muted)" }}>
        <Icon d={icons[icon]} size={15} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {loading ? "—" : value}
        </p>
        <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth() ?? {};

  const displayName = user?.username
    ? `@${user.username}`
    : user?.email
      ? user.email.split("@")[0].split(/[._-]/)[0].replace(/^\w/, c => c.toUpperCase())
      : "there";

  const userId = user?.id ? parseInt(user.id) : null;

  const [dashStats,  setDashStats]  = useState(null);
  const [learnStats, setLearnStats] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [quote,      setQuote]      = useState(null);

  useEffect(() => {
    const idx = new Date().getDate() % quotes.length;
    setQuote(quotes[idx]);
  }, []);

  // useEffect(() => {
  //   if (!userId) return;
  //   Promise.allSettled([
  //     api.get(`/dashboard/users/${userId}/stats`),
  //     api.get(`/learn/users/${userId}/stats`),
  //   ]).then(([dashRes, learnRes]) => {
  //     if (dashRes.status  === "fulfilled") setDashStats(dashRes.value.data);
  //     if (learnRes.status === "fulfilled") setLearnStats(learnRes.value.data);
  //   }).finally(() => setLoading(false));
  // }, [userId]);
  useEffect(() => {
  if (!user?.id) return;

  const uid = parseInt(user.id);

  Promise.allSettled([
    api.get(`/dashboard/users/${uid}/stats`),
    api.get(`/learn/users/${uid}/stats`),
  ])
  .then(([dashRes, learnRes]) => {
    if (dashRes.status === "fulfilled") setDashStats(dashRes.value.data);
    if (learnRes.status === "fulfilled") setLearnStats(learnRes.value.data);
  })
  .finally(() => setLoading(false));

}, [user]);

  const overview    = dashStats?.overview ?? {};
  const totalXp     = learnStats?.total_xp ?? 0;
  const level       = Math.floor(totalXp / 1000) + 1;
  const xpInLevel   = totalXp % 1000;
  const xpPct       = (xpInLevel / 1000) * 100;

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-24 px-5"
        style={{ paddingTop: "72px", background: "var(--bg-primary)" }}>
        <div className="max-w-5xl mx-auto flex flex-col gap-10">

          {/* ── HEADER ── */}
          <motion.div {...fadeUp(0)} className="pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: "var(--text-muted)" }}>
              Dashboard
            </p>
            <h1 className="text-[28px] font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}>
              Hey, {displayName} 👋
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {user?.email}
            </p>
          </motion.div>

          {/* ── QUOTE + XP — side by side ── */}
          <motion.div {...fadeUp(0.05)} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Quote */}
            {quote && (
              <div className="rounded-2xl border px-5 py-5 flex flex-col justify-between gap-4"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <p className="text-[13px] font-light leading-relaxed italic"
                  style={{ color: "var(--text-primary)" }}>
                  "{quote.text}"
                </p>
                <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                  — {quote.author}
                </p>
              </div>
            )}

            {/* XP Bar */}
            <div className="rounded-2xl border px-5 py-5 flex flex-col justify-between gap-4"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon d={icons.xp} size={13} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}>
                    Level {level}
                  </span>
                </div>
                <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                  {xpInLevel} / 1000 XP
                </span>
              </div>
              <div>
                <div className="h-2 rounded-full overflow-hidden mb-2"
                  style={{ background: "var(--border)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--text-primary)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                    Level {level}
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                    Level {level + 1}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {totalXp}
                </span>
                <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                  total XP
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── OVERVIEW ── */}
          <motion.div {...fadeUp(0.1)}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-muted)" }}>
              Overview
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Resumes",    value: overview.total_resumes   ?? 0, icon: "resume" },
                { label: "JDs",        value: overview.total_jds       ?? 0, icon: "jd" },
                { label: "Interviews", value: overview.total_interviews ?? 0, icon: "interview" },
                { label: "Comments",   value: overview.total_comments  ?? 0, icon: "community" },
              ].map(({ label, value, icon }) => (
                <StatCard key={label} icon={icon} value={value} label={label} loading={loading} />
              ))}
            </div>
          </motion.div>

          {/* ── LEARNING ── */}
          <motion.div {...fadeUp(0.15)}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-muted)" }}>
              Learning
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total XP",         value: totalXp,                            icon: "xp",     accent: "#f59e0b" },
                { label: "Day Streak 🔥",     value: learnStats?.current_streak  ?? 0,  icon: "streak", accent: "#f97316" },
                { label: "Topics Completed", value: learnStats?.topics_completed ?? 0,  icon: "trophy", accent: "#a78bfa" },
              ].map(({ label, value, icon, accent }) => (
                <StatCard key={label} icon={icon} value={value} label={label} loading={loading} accent={accent} />
              ))}
            </div>
          </motion.div>
          
          {/* ── INTERVIEW PERFORMANCE ── */}
          {/*dashStats?.interview_stats && (
            <motion.div {...fadeUp(0.2)}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--text-muted)" }}>
                Interview Performance
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Avg Score",   value: dashStats.interview_stats.average_score },
                  { label: "Correctness", value: dashStats.interview_stats.avg_correctness },
                  { label: "Depth",       value: dashStats.interview_stats.avg_depth },
                  { label: "Clarity",     value: dashStats.interview_stats.avg_clarity },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-2xl p-5 border"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                    <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {value ?? 0}
                    </p>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )*/}
          {/* ── QUICK ACTIONS ── */}
          <motion.div {...fadeUp(0.25)}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-muted)" }}>
              Quick Actions
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { href: "/dashboard/jd",         title: "Analyze JD",      desc: "Extract skills and requirements.",  icon: "jd"        },
                { href: "/dashboard/interview",   title: "AI Interview",    desc: "Practice role-specific questions.", icon: "interview" },
                { href: "/dashboard/learn",       title: "Learn & Earn XP", desc: "Quiz-based learning with streaks.", icon: "learn"     },
                { href: "/dashboard/community",   title: "Community",       desc: "Discuss with other learners.",      icon: "community" },
                { href: "/dashboard/learn/stats", title: "My Progress",     desc: "XP, streaks and leaderboard.",      icon: "trophy"    },
              ].map(({ href, title, desc, icon }) => (
                <Link key={href} href={href}
                  className="rounded-2xl p-5 border transition-all duration-150 group flex flex-col gap-3 no-underline"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--text-muted)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <div className="flex items-center justify-between">
                    <div style={{ color: "var(--text-muted)" }}>
                      <Icon d={icons[icon]} size={15} />
                    </div>
                    <div style={{ color: "var(--text-muted)" }}>
                      <Icon d={icons.arrow} size={11} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {title}
                    </p>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </ProtectedRoute>
  );
}