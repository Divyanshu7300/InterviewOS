"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/axios";
import { useAuth } from "../../../../context/AuthContext";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { motion } from "framer-motion";

const MEDALS = ["1", "2", "3"];

const colors = {
  sky: { text: "text-sky-300", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.24)" },
  emerald: { text: "text-emerald-300", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.22)" },
  amber: { text: "text-amber-300", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.24)" },
  violet: { text: "text-violet-300", bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.24)" },
};

const icons = {
  xp: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  streak: "M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.23.1-.47.04-.66-.12a.58.58 0 01-.14-.17c-1.13-1.43-1.31-3.48-.55-5.12C5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5.14.6.41 1.2.71 1.73 1.08 1.73 2.95 2.97 4.96 3.22 2.14.27 4.43-.12 6.07-1.6 1.83-1.66 2.47-4.32 1.53-6.6l-.13-.26c-.21-.46-.77-1.26-.77-1.26z",
  topics: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  accuracy: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 17a5 5 0 100-10 5 5 0 000 10zM12 13a1 1 0 100-2 1 1 0 000 2z",
};

const Icon = ({ d, size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 16, filter: "blur(4px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay } });

function Panel({ eyebrow, title, description, children, aside }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[0_24px_80px_rgba(3,7,18,0.24)] sm:p-7">
      <div className="absolute inset-0 opacity-80" style={{ background: "var(--panel-glow)" }} />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="flex flex-col gap-4">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{eyebrow}</p><h2 className="mt-2 text-[26px] font-black tracking-[-0.03em] text-[var(--text-primary)]">{title}</h2>{description ? <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">{description}</p> : null}</div>
          {children}
        </div>
        {aside ? <div className="relative">{aside}</div> : null}
      </div>
    </div>
  );
}

function Metric({ label, value, icon, tone }) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border p-5" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
      <span className={`flex h-11 w-11 items-center justify-center rounded-[16px] border ${tone.text}`} style={{ background: tone.bg, borderColor: tone.border }}><Icon d={icons[icon]} size={17} /></span>
      <p className="mt-6 text-[30px] font-black leading-none text-[var(--text-primary)]">{value}</p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([api.get(`/learn/users/${user.id}/stats`), api.get("/learn/leaderboard?limit=10")])
      .then(([sRes, lRes]) => { setStats(sRes.data); setLeaderboard(lRes.data); })
      .catch(() => setError("Failed to load data."))
      .finally(() => setLoading(false));
  }, [user]);

  const myRank = leaderboard?.entries?.find((e) => e.user_id === user?.id);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-28 pt-[84px] sm:px-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <motion.section {...fadeUp(0)} className="theme-hero relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-7 shadow-[0_28px_90px_rgba(3,7,18,0.34)] sm:px-8 sm:py-9">
            <div className="absolute inset-0" style={{ background: "var(--hero-surface)" }} />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-end">
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200/80">Learning Stats</p><h1 className="mt-3 max-w-3xl text-[36px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[52px]">Your learning progress and rank.</h1><p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-200/80">Track XP, streaks, accuracy, completed topics, and where you stand on the leaderboard.</p></div>
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">My Rank</p>
                <p className="mt-5 text-3xl font-black text-white">{myRank ? `#${myRank.rank}` : "-"}</p>
                <p className="mt-2 text-sm text-slate-300">{leaderboard?.total_users || 0} total learners</p>
                <button onClick={() => router.push("/dashboard/learn")} className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-[18px] px-4 text-sm font-bold text-white" style={{ background: "var(--brand-gradient)" }}>Back to Learn</button>
              </div>
            </div>
          </motion.section>
          {error ? <div className="rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div> : null}
          {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-[24px] bg-[var(--bg-secondary)]" />)}</div> : (
            <>
              {stats ? (
                <Panel eyebrow="Progress" title="Learning metrics" description="A quick read on your practice consistency and accuracy.">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric label="Total XP" value={stats.total_xp?.toLocaleString()} icon="xp" tone={colors.sky} />
                    <Metric label="Current Streak" value={stats.current_streak} icon="streak" tone={colors.amber} />
                    <Metric label="Topics Done" value={stats.topics_completed} icon="topics" tone={colors.violet} />
                    <Metric label="Accuracy" value={`${stats.accuracy}%`} icon="accuracy" tone={colors.emerald} />
                  </div>
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                    <div className="mb-3 flex justify-between text-sm font-bold text-[var(--text-primary)]"><span>Accuracy</span><span>{stats.accuracy}%</span></div>
                    <div className="h-3 overflow-hidden rounded-full bg-[var(--border)]"><motion.div className="h-full rounded-full" style={{ background: "var(--brand-gradient-strong)" }} initial={{ width: 0 }} animate={{ width: `${stats.accuracy}%` }} transition={{ duration: 0.8 }} /></div>
                  </div>
                </Panel>
              ) : null}
              {leaderboard ? (
                <Panel eyebrow="Leaderboard" title="Top learners" description="See how your XP and streak compare with other learners.">
                  {myRank ? <div className="rounded-[20px] border border-sky-300/25 bg-sky-400/10 px-4 py-3 text-sm font-bold text-[var(--text-primary)]">Your rank: #{myRank.rank} · {myRank.total_xp} XP · {myRank.current_streak} streak</div> : null}
                  <div className="flex flex-col gap-2">
                    {leaderboard.entries.map((entry, i) => {
                      const isMe = entry.user_id === user?.id;
                      return (
                        <div key={entry.user_id} className="flex items-center gap-4 rounded-[20px] border px-4 py-3" style={{ background: isMe ? "var(--selected-bg)" : "var(--bg-secondary)", borderColor: isMe ? "var(--selected-border)" : "var(--border)", boxShadow: isMe ? "0 14px 36px var(--selected-ring)" : "none" }}>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-[var(--border)] bg-[var(--bg-card)] text-sm font-black text-[var(--text-primary)]">{MEDALS[i] || entry.rank}</span>
                          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[var(--text-primary)]">{isMe ? "You" : entry.email}</p><p className="text-xs text-[var(--text-secondary)]">{entry.topics_completed} topics · {entry.current_streak} streak</p></div>
                          <span className="text-sm font-black text-[var(--text-primary)]">{entry.total_xp.toLocaleString()} XP</span>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              ) : null}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
