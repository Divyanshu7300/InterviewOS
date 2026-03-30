"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/axios";
import { useAuth } from "../../../../context/AuthContext";
import ProtectedRoute from "../../../../components/ProtectedRoute";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function StatsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [stats, setStats]           = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      api.get(`/learn/users/${user.id}/stats`),
      api.get("/learn/leaderboard?limit=10"),
    ])
      .then(([sRes, lRes]) => {
        setStats(sRes.data);
        setLeaderboard(lRes.data);
      })
      .catch(() => setError("Failed to load data."))
      .finally(() => setLoading(false));
  }, [user]);

  const myRank = leaderboard?.entries?.find(e => e.user_id === user?.id);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] px-5 pb-24 pt-[72px]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">

          {/* Header */}
          <div className="flex items-center justify-between pt-6">
            <div>
              <h1 className="text-[32px] font-bold text-[var(--text-primary)]">My Progress</h1>
              <p className="mt-2 text-base text-[var(--text-primary)]">{user?.email}</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/learn")}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-primary)] transition-all"
            >
              ← Learn
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--bg-secondary)]" />
              ))}
            </div>
          ) : (
            <>
              {/* Stat cards */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total XP",       value: stats.total_xp?.toLocaleString() },
                    { label: "Current Streak", value: `${stats.current_streak} 🔥` },
                    { label: "Topics Done",    value: stats.topics_completed },
                    { label: "Accuracy",       value: `${stats.accuracy}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                      <p className="mb-3 text-sm text-[var(--text-primary)]">{label}</p>
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Accuracy + Streak row */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                    <p className="mb-3 text-sm text-[var(--text-primary)]">Accuracy</p>
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${stats.accuracy}%`, background: "var(--text-primary)" }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-[var(--text-primary)]">
                      <span>0%</span>
                      <span>{stats.accuracy}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                    <p className="mb-3 text-sm text-[var(--text-primary)]">Streaks</p>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.current_streak} 🔥</p>
                        <p className="mt-1 text-sm text-[var(--text-primary)]">Current</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.longest_streak}</p>
                        <p className="mt-1 text-sm text-[var(--text-primary)]">Best ever</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard */}
              {leaderboard && (
                <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-[var(--text-primary)]">Leaderboard 🏆</h2>
                    <span className="text-sm text-[var(--text-primary)]">
                      {leaderboard.total_users} total learners
                    </span>
                  </div>

                  {/* My rank banner */}
                  {myRank && (
                    <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
                      <span className="text-sm text-[var(--text-primary)]">Your rank</span>
                      <span className="text-lg font-bold text-[var(--text-primary)]">#{myRank.rank}</span>
                      <span className="text-sm text-[var(--text-primary)]">{myRank.total_xp} XP · {myRank.current_streak}🔥</span>
                    </div>
                  )}

                  {/* Entries */}
                  <div className="flex flex-col gap-2">
                    {leaderboard.entries.map((e, i) => {
                      const isMe = e.user_id === user?.id;
                      return (
                        <div
                          key={e.user_id}
                          className="flex items-center gap-4 px-4 py-3 rounded-xl border transition-all"
                          style={{
                            background: isMe ? "var(--bg-secondary)" : "transparent",
                            borderColor: isMe ? "var(--text-muted)" : "var(--border)",
                          }}
                        >
                          <span className="w-8 text-center shrink-0">
                            {MEDALS[i] || (
                              <span className="text-xs font-mono text-[var(--text-primary)]">#{e.rank}</span>
                            )}
                          </span>

                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                            {e.email?.[0]?.toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                              {isMe ? "You" : e.email}
                            </p>
                            <p className="text-sm text-[var(--text-primary)]">
                              {e.topics_completed} topics · {e.current_streak}🔥
                            </p>
                          </div>

                          <span className="text-sm font-bold shrink-0"
                            style={{
                              color: i === 0 ? "#facc15" : i === 1 ? "#d4d4d8" : i === 2 ? "#fb923c" : "var(--text-primary)",
                            }}>
                            {e.total_xp.toLocaleString()} XP
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
