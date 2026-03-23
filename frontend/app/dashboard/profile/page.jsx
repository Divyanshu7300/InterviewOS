"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/axios";
import { motion } from "framer-motion";

const COLORS = [
  "bg-blue-500/20 text-blue-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-amber-500/20 text-amber-300",
  "bg-rose-500/20 text-rose-300",
  "bg-purple-500/20 text-purple-300",
];

function BigAvatar({ name }) {
  const str      = name ?? "?";
  const initials = str.replace("@", "").slice(0, 2).toUpperCase();
  const color    = COLORS[str.charCodeAt(0) % COLORS.length];
  return (
    <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function ProgressBar({ value, max, color = "bg-emerald-400" }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
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
      className="rounded-2xl p-5 flex flex-col gap-4 border"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}>
          {title}
        </p>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0"
      style={{ borderColor: "var(--border)" }}>
      <span className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function StreakCalendar({ streak }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalWeeks = 53;
  const startDate  = new Date(today);
  startDate.setDate(today.getDate() - (totalWeeks * 7 - 1));
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const allDays = Array.from({ length: totalWeeks * 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  const activeFrom = new Date(today);
  if (streak > 0) activeFrom.setDate(today.getDate() - (streak - 1));

  const weeks = Array.from({ length: totalWeeks }, (_, wi) =>
    allDays.slice(wi * 7, wi * 7 + 7)
  );

  const monthLabels = weeks.map((week, wi) => {
    for (const d of week) {
      if (d.getDate() === 1 || (wi === 0 && d.getDate() <= 7)) {
        return d.toLocaleString("default", { month: "short" });
      }
    }
    return null;
  });

  const dedupedLabels = monthLabels.map((label, i) => {
    if (!label) return null;
    if (i > 0 && monthLabels[i - 1] === label) return null;
    return label;
  });

  const getDotColor = (d) => {
    if (d > today) return null;
    if (streak === 0 || d < activeFrom) return "rgba(255,255,255,0.06)";
    const daysFromToday = Math.floor((today - d) / 86400000);
    if (daysFromToday === 0)  return "rgba(52,211,153,1.0)";
    if (daysFromToday <= 2)   return "rgba(52,211,153,0.85)";
    if (daysFromToday <= 6)   return "rgba(52,211,153,0.65)";
    return                           "rgba(52,211,153,0.45)";
  };

  return (
    <div style={{ overflowX: "auto", paddingBottom: "4px" }}>
      <div style={{ display: "inline-flex", flexDirection: "column", gap: "4px" }}>

        {/* Month labels */}
        <div style={{ display: "flex", gap: "2px", marginLeft: "18px" }}>
          {weeks.map((_, wi) => (
            <div key={wi} style={{ width: "13px", flexShrink: 0 }}>
              {dedupedLabels[wi] && (
                <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap", display: "block" }}>
                  {dedupedLabels[wi]}
                </span>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0px" }}>

          {/* Day labels */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginRight: "4px" }}>
            {["", "Mon", "", "Wed", "", "Fri", ""].map((l, i) => (
              <div key={i} style={{ height: "13px", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-muted)", width: "14px" }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div style={{ display: "flex", gap: "2px" }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {week.map((d, di) => {
                  const bg      = getDotColor(d);
                  const isToday = d.toDateString() === today.toDateString();
                  const future  = d > today;
                  return (
                    <div key={di}
                      title={d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      style={{
                        width: "13px", height: "13px", borderRadius: "2px",
                        background:   future ? "rgba(255,255,255,0.03)" : bg,
                        outline:      isToday ? "1.5px solid rgba(52,211,153,0.8)" : "none",
                        outlineOffset: "1px",
                        cursor: "default",
                        transition: "background 0.2s",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", marginLeft: "18px" }}>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 }}>Less</span>
          {["rgba(255,255,255,0.06)", "rgba(52,211,153,0.25)", "rgba(52,211,153,0.45)", "rgba(52,211,153,0.65)", "rgba(52,211,153,0.85)", "rgba(52,211,153,1.0)"].map((bg, i) => (
            <div key={i} style={{ width: "13px", height: "13px", borderRadius: "2px", background: bg, flexShrink: 0 }} />
          ))}
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 }}>More</span>
        </div>

      </div>
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

  const fetchData = useCallback(async (showRefresh = false) => {
    if (!userId) return;
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    const [learnRes, tokenRes] = await Promise.allSettled([
      api.get(`/learn/users/${userId}/stats`),    // ← fixed
      api.get(`/tokens/users/${userId}/usage`),   // ← fixed
    ]);

    if (learnRes.status === "fulfilled") setLearnStats(learnRes.value.data);
    if (tokenRes.status === "fulfilled") setTokenStats(tokenRes.value.data);

    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const totalXp         = learnStats?.total_xp         ?? 0;
  const streak          = learnStats?.current_streak   ?? 0;
  const longestStreak   = learnStats?.longest_streak   ?? 0;
  const topicsCompleted = learnStats?.topics_completed ?? 0;
  const accuracy        = learnStats?.accuracy         ?? 0;

  const level     = Math.floor(totalXp / 1000) + 1;
  const xpInLevel = totalXp % 1000;

  const tokensUsed      = tokenStats?.used      ?? 0;
  const tokenLimit      = tokenStats?.limit     ?? 10000;
  const tokensRemaining = tokenStats?.remaining ?? tokenLimit;
  const tokenPct        = Math.min((tokensUsed / tokenLimit) * 100, 100);
  const tokenColor      = tokenPct > 80 ? "bg-rose-400" : tokenPct > 50 ? "bg-amber-400" : "bg-emerald-400";

  const RefreshBtn = () => (
    <button onClick={() => fetchData(true)}
      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5"
      style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-secondary)" }}>
      <span className={refreshing ? "animate-spin inline-block" : ""}>↻</span>
      {refreshing ? "Refreshing…" : "Refresh"}
    </button>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-24 px-5"
        style={{ paddingTop: "72px", background: "var(--bg-primary)" }}>
        <div className="max-w-2xl mx-auto flex flex-col gap-5">

          {/* ── HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4 p-6 rounded-2xl border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <BigAvatar name={displayName} />
            <div className="flex flex-col gap-1 flex-1">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {displayName}
              </h1>
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {[
                  `🔥 ${streak} day streak`,
                  `⚡ ${totalXp} XP`,
                  `🏆 Level ${level}`,
                ].map(tag => (
                  <span key={tag}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border"
                    style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── XP & LEVEL ── */}
          <Card title="XP & Level" delay={0.05}>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Level {level}</span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{xpInLevel} / 1000 XP</span>
            </div>
            <ProgressBar value={xpInLevel} max={1000} color="bg-emerald-400" />
            <div className="flex justify-between text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
              <span>Level {level}</span>
              <span>Level {level + 1}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              {[
                { label: "Total XP",    value: loading ? "—" : totalXp },
                { label: "Topics Done", value: loading ? "—" : topicsCompleted },
                { label: "Accuracy",    value: loading ? "—" : `${accuracy}%` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1 pt-1">
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
                  <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── TOKEN USAGE ── */}
          <Card title="Token Usage — Today" delay={0.1} action={<RefreshBtn />}>
            {loading ? (
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Loading…</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Daily Limit</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                    {tokensUsed.toLocaleString()} / {tokenLimit.toLocaleString()}
                  </span>
                </div>
                <ProgressBar value={tokensUsed} max={tokenLimit} color={tokenColor} />
                <div className="grid grid-cols-3 gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  {[
                    { label: "Used Today",  value: tokensUsed.toLocaleString() },
                    { label: "Remaining",   value: tokensRemaining.toLocaleString() },
                    { label: "Daily Limit", value: tokenLimit.toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-1 pt-1">
                      <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
                      <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
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

          {/* ── STREAK CALENDAR ── */}
          <Card title="Streak — Full Year" delay={0.15}>
            <div className="grid grid-cols-2 gap-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
              {[
                { label: "Current Streak", value: `🔥 ${streak} days` },
                { label: "Longest Streak", value: `🏆 ${longestStreak} days` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {loading ? "—" : value}
                  </p>
                  <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>
            <StreakCalendar streak={streak} />
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