"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";

const Icon = ({ d, size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);

const icons = {
  refresh: "M21 12a9 9 0 11-2.64-6.36M21 3v6h-6",
  xp: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  streak: "M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.23.1-.47.04-.66-.12a.58.58 0 01-.14-.17c-1.13-1.43-1.31-3.48-.55-5.12C5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5.14.6.41 1.2.71 1.73 1.08 1.73 2.95 2.97 4.96 3.22 2.14.27 4.43-.12 6.07-1.6 1.83-1.66 2.47-4.32 1.53-6.6l-.13-.26c-.21-.46-.77-1.26-.77-1.26z",
  trophy: "M8 21h8M12 17v4M17 3H7l-2 7c0 2.76 2.24 5 5 5s5-2.24 5-5L17 3zM5 8H2M19 8h3",
  target: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 17a5 5 0 100-10 5 5 0 000 10zM12 13a1 1 0 100-2 1 1 0 000 2z",
  tokens: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7H14.5a3.5 3.5 0 010 7H6",
  account: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  alert: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
};

const colors = {
  sky: { text: "text-sky-300", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.24)" },
  emerald: { text: "text-emerald-300", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.22)" },
  amber: { text: "text-amber-300", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.24)" },
  violet: { text: "text-violet-300", bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.24)" },
  rose: { text: "text-rose-300", bg: "rgba(244, 63, 94, 0.12)", border: "rgba(244, 63, 94, 0.24)" },
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay },
});

function ProgressBar({ value, max, tone = colors.emerald }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-3 overflow-hidden rounded-full bg-[var(--border)]">
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${tone.bg}, ${tone.border}, currentColor)`, color: tone.border }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

function Panel({ eyebrow, title, description, children, aside }) {
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

function MetricCard({ label, value, icon, tone = colors.sky, loading }) {
  return (
    <div
      className="group relative overflow-hidden rounded-[24px] border p-5 transition-all duration-200 hover:-translate-y-1"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at top right, ${tone.bg}, transparent 40%)` }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-[16px] border ${tone.text}`}
          style={{ background: tone.bg, borderColor: tone.border }}
        >
          <Icon d={icons[icon]} size={17} />
        </span>
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

function RefreshButton({ onClick, refreshing }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex min-h-[42px] items-center gap-2 rounded-[16px] border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm font-bold text-[var(--text-primary)] transition-all hover:-translate-y-0.5"
    >
      <Icon d={icons.refresh} size={13} className={refreshing ? "animate-spin" : ""} />
      <span className={refreshing ? "animate-pulse" : ""}>{refreshing ? "Refreshing..." : "Refresh"}</span>
    </button>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-3 last:border-0">
      <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>
      <span className="truncate text-sm font-bold text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth() ?? {};
  const userId = user?.id ? parseInt(user.id) : null;

  const displayName = user?.username
    ? `@${user.username}`
    : user?.email?.split("@")[0] ?? "User";

  const [learnStats, setLearnStats] = useState(null);
  const [tokenStats, setTokenStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);

    const [learnRes, tokenRes] = await Promise.allSettled([
      api.get(`/learn/users/${userId}/stats`),
      api.get(`/tokens/users/${userId}/usage`),
    ]);

    if (learnRes.status === "fulfilled") setLearnStats(learnRes.value.data);
    if (tokenRes.status === "fulfilled") setTokenStats(tokenRes.value.data);

    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let active = true;

    Promise.allSettled([
      api.get(`/learn/users/${userId}/stats`),
      api.get(`/tokens/users/${userId}/usage`),
    ]).then(([learnRes, tokenRes]) => {
      if (!active) return;

      if (learnRes.status === "fulfilled") setLearnStats(learnRes.value.data);
      if (tokenRes.status === "fulfilled") setTokenStats(tokenRes.value.data);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => refreshData(), 60000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const totalXp = learnStats?.total_xp ?? 0;
  const streak = learnStats?.current_streak ?? 0;
  const longestStreak = learnStats?.longest_streak ?? 0;
  const topicsCompleted = learnStats?.topics_completed ?? 0;
  const accuracy = learnStats?.accuracy ?? 0;

  const level = Math.floor(totalXp / 1000) + 1;
  const xpInLevel = totalXp % 1000;

  const tokensUsed = tokenStats?.used ?? 0;
  const tokenLimit = tokenStats?.limit ?? 50000;
  const tokensRemaining = tokenStats?.remaining ?? tokenLimit;
  const tokenPct = Math.min((tokensUsed / tokenLimit) * 100, 100);
  const tokenTone = tokenPct > 80 ? colors.rose : tokenPct > 50 ? colors.amber : colors.emerald;

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
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <UserAvatar name={displayName} size="lg" className="rounded-[22px] border-white/15 bg-white/10" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200/80">
                    Profile
                  </p>
                  <h1 className="mt-3 max-w-3xl text-[36px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[52px]">
                    {displayName}
                  </h1>
                  <p className="mt-4 max-w-2xl truncate text-[15px] leading-7 text-slate-200/80 sm:text-[16px]">
                    {user?.email || "Signed in user"}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      { label: `${streak} day streak`, tone: colors.amber },
                      { label: `${totalXp.toLocaleString()} XP`, tone: colors.sky },
                      { label: `Level ${level}`, tone: colors.emerald },
                    ].map((tag) => (
                      <span
                        key={tag.label}
                        className={`rounded-[14px] border px-3 py-1.5 text-xs font-bold ${tag.tone.text}`}
                        style={{ background: tag.tone.bg, borderColor: tag.tone.border }}
                      >
                        {loading ? "-" : tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Profile Preview
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { label: "Level", value: level },
                    { label: "XP", value: totalXp.toLocaleString() },
                    { label: "Streak", value: `${streak} days` },
                    { label: "Tokens left", value: tokensRemaining.toLocaleString() },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white/6 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                      <p className="mt-1 text-base font-bold text-white">{loading ? "-" : item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          <motion.div {...fadeUp(0.08)}>
            <Panel
              eyebrow="Learning Progress"
              title="XP and level"
              description="Your learning progress rolls up into a simple level, XP, topics, and accuracy view."
              aside={
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Current level
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-[var(--text-primary)]">Level {level}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                    {1000 - xpInLevel} XP left before Level {level + 1}.
                  </p>
                </div>
              }
            >
              <div className="rounded-[26px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <span className="text-base font-bold text-[var(--text-primary)]">Level {level}</span>
                  <span className="text-sm font-bold text-[var(--text-secondary)]">{xpInLevel} / 1000 XP</span>
                </div>
                <ProgressBar value={xpInLevel} max={1000} tone={colors.emerald} />
                <div className="mt-3 flex justify-between text-xs font-semibold text-[var(--text-muted)]">
                  <span>Level {level}</span>
                  <span>Level {level + 1}</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard label="Total XP" value={totalXp.toLocaleString()} icon="xp" tone={colors.sky} loading={loading} />
                <MetricCard label="Topics Done" value={topicsCompleted} icon="trophy" tone={colors.violet} loading={loading} />
                <MetricCard label="Accuracy" value={`${accuracy}%`} icon="target" tone={colors.emerald} loading={loading} />
              </div>
            </Panel>
          </motion.div>

          <motion.div {...fadeUp(0.14)}>
            <Panel
              eyebrow="Token Usage"
              title="Daily AI usage"
              description="Track today's token usage so you know how much runway is left for AI analysis, practice, and feedback."
              aside={
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Live usage
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    This refreshes automatically every minute. You can also refresh it now.
                  </p>
                  <div className="mt-4">
                    <RefreshButton onClick={refreshData} refreshing={refreshing} />
                  </div>
                </div>
              }
            >
              {loading ? (
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5 text-sm font-semibold text-[var(--text-secondary)]">
                  Loading usage...
                </div>
              ) : (
                <>
                  <div className="rounded-[26px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <span className="text-base font-bold text-[var(--text-primary)]">Daily Limit</span>
                      <span className={`text-sm font-bold ${tokenTone.text}`}>
                        {tokensUsed.toLocaleString()} / {tokenLimit.toLocaleString()}
                      </span>
                    </div>
                    <ProgressBar value={tokensUsed} max={tokenLimit} tone={tokenTone} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard label="Used Today" value={tokensUsed.toLocaleString()} icon="tokens" tone={tokenTone} />
                    <MetricCard label="Remaining" value={tokensRemaining.toLocaleString()} icon="target" tone={colors.emerald} />
                    <MetricCard label="Daily Limit" value={tokenLimit.toLocaleString()} icon="tokens" tone={colors.violet} />
                  </div>

                  {tokenPct > 80 ? (
                    <div className="flex items-center gap-2 rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
                      <Icon d={icons.alert} size={14} />
                      Token limit almost reached. {Math.round(100 - tokenPct)}% remaining.
                    </div>
                  ) : null}
                </>
              )}
            </Panel>
          </motion.div>

          <motion.div {...fadeUp(0.2)}>
            <Panel
              eyebrow="Streaks"
              title="Consistency signals"
              description="Streaks show how often you return to practice and learn."
              aside={
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Streak note
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    Consistent small sessions beat occasional long cramming sessions.
                  </p>
                </div>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricCard label="Current Streak" value={`${streak} days`} icon="streak" tone={colors.amber} loading={loading} />
                <MetricCard label="Longest Streak" value={`${longestStreak} days`} icon="trophy" tone={colors.violet} loading={loading} />
              </div>
            </Panel>
          </motion.div>

          <motion.div {...fadeUp(0.24)}>
            <Panel
              eyebrow="Account"
              title="Account details"
              description="Basic profile information used across your dashboard, community posts, and learning progress."
              aside={
                <div
                  className="rounded-[24px] border p-5"
                  style={{ background: colors.sky.bg, borderColor: colors.sky.border }}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-sky-300/25 bg-white/5 text-sky-300">
                    <Icon d={icons.account} size={17} />
                  </span>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    These fields come from your signed-in account.
                  </p>
                </div>
              }
            >
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] px-5">
                <StatRow label="Email" value={user?.email ?? "-"} />
                <StatRow label="Username" value={user?.username ? `@${user.username}` : "-"} />
              </div>
            </Panel>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
