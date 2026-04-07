"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";

function ProgressBar({ value, max, color = "bg-emerald-400" }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

function Card({ title, delay = 0, action, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-primary)]">
          {title}
        </p>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

function RefreshButton({ onClick, refreshing }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] transition-all"
    >
      <span className={refreshing ? "animate-spin inline-block" : ""}>↻</span>
      {refreshing ? "Refreshing..." : "Refresh"}
    </button>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-2.5 last:border-0">
      <span className="text-[13px] font-medium text-[var(--text-primary)]">{label}</span>
      <span className="text-[13px] font-semibold text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth() ?? {};
  const userId   = user?.id ? parseInt(user.id) : null;

  const displayName = user?.username
    ? `@${user.username}`
    : user?.email?.split("@")[0] ?? "User";

  const [learnStats, setLearnStats] = useState(null);
  const [tokenStats, setTokenStats] = useState(null);
  const [loading,    setLoading]    = useState(true);
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

  const totalXp         = learnStats?.total_xp         ?? 0;
  const streak          = learnStats?.current_streak   ?? 0;
  const longestStreak   = learnStats?.longest_streak   ?? 0;
  const topicsCompleted = learnStats?.topics_completed ?? 0;
  const accuracy        = learnStats?.accuracy         ?? 0;

  const level     = Math.floor(totalXp / 1000) + 1;
  const xpInLevel = totalXp % 1000;

  const tokensUsed      = tokenStats?.used      ?? 0;
  const tokenLimit      = tokenStats?.limit     ?? 50000;
  const tokensRemaining = tokenStats?.remaining ?? tokenLimit;
  const tokenPct        = Math.min((tokensUsed / tokenLimit) * 100, 100);
  const tokenColor      = tokenPct > 80 ? "bg-rose-400" : tokenPct > 50 ? "bg-amber-400" : "bg-emerald-400";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-24 pt-[80px] sm:px-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-5">

          {/* ── HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6"
          >
            <UserAvatar name={displayName} size="lg" className="rounded-2xl" />
            <div className="flex flex-col gap-1 flex-1">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">
                {displayName}
              </h1>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {[
                  `🔥 ${streak} day streak`,
                  `⚡ ${totalXp} XP`,
                  `🏆 Level ${level}`,
                ].map(tag => (
                  <span key={tag}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── XP & LEVEL ── */}
          <Card title="XP & Level" delay={0.05}>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-[var(--text-primary)]">Level {level}</span>
              <span className="text-xs font-semibold text-[var(--text-primary)]">{xpInLevel} / 1000 XP</span>
            </div>
            <ProgressBar value={xpInLevel} max={1000} color="bg-emerald-400" />
            <div className="flex justify-between text-[11px] font-medium text-[var(--text-primary)]">
              <span>Level {level}</span>
              <span>Level {level + 1}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-2">
              {[
                { label: "Total XP",    value: loading ? "—" : totalXp },
                { label: "Topics Done", value: loading ? "—" : topicsCompleted },
                { label: "Accuracy",    value: loading ? "—" : `${accuracy}%` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1 pt-1">
                  <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
                  <p className="text-[11px] font-medium text-[var(--text-primary)]">{label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── TOKEN USAGE ── */}
          <Card
            title="Token Usage - Today"
            delay={0.1}
            action={<RefreshButton onClick={refreshData} refreshing={refreshing} />}
          >
            {loading ? (
              <p className="text-sm font-medium text-[var(--text-primary)]">Loading…</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[var(--text-primary)]">Daily Limit</span>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    {tokensUsed.toLocaleString()} / {tokenLimit.toLocaleString()}
                  </span>
                </div>
                <ProgressBar value={tokensUsed} max={tokenLimit} color={tokenColor} />
                <div className="grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-2">
                  {[
                    { label: "Used Today",  value: tokensUsed.toLocaleString() },
                    { label: "Remaining",   value: tokensRemaining.toLocaleString() },
                    { label: "Daily Limit", value: tokenLimit.toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-1 pt-1">
                      <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
                      <p className="text-[11px] font-medium text-[var(--text-primary)]">{label}</p>
                    </div>
                  ))}
                </div>
                {tokenPct > 80 && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    ⚠ Token limit almost reached — {Math.round(100 - tokenPct)}% remaining
                  </div>
                )}
              </>
            )}
          </Card>

          {/* ── STREAKS ── */}
          <Card title="Streaks" delay={0.15}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: "Current Streak", value: `🔥 ${streak} days` },
                { label: "Longest Streak", value: `🏆 ${longestStreak} days` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                    {label}
                  </p>
                  <p className="mt-3 text-[28px] font-bold tracking-tight text-[var(--text-primary)]">
                    {loading ? "—" : value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                    {label === "Current Streak"
                      ? "Consecutive active days based on your latest learning activity."
                      : "Your best streak so far."}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── ACCOUNT ── */}
          <Card title="Account Info" delay={0.2}>
            <StatRow label="Email"    value={user?.email ?? "—"} />
            <StatRow label="Username" value={user?.username ? `@${user.username}` : "—"} />
          </Card>

        </div>
      </div>
    </ProtectedRoute>
  );
}
