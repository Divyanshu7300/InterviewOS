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
    if (!user?.id) { setLoading(false); return; }
    Promise.all([
      api.get(`/learn/users/${user.id}/stats`),
      api.get("/learn/leaderboard?limit=10"),
    ])
      .then(([sRes, lRes]) => {
        setStats(sRes.data);
        setLeaderboard(lRes.data);
      })
      .catch(() => setError("Data load nahi hua."))
      .finally(() => setLoading(false));
  }, [user]);

  const myRank = leaderboard?.entries?.find(e => e.user_id === user?.id);

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Progress</h1>
            <p className="text-white/40 text-sm mt-1">{user?.email}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/learn")}
            className="text-xs text-white/40 border border-white/10 px-4 py-2 rounded-lg hover:border-white/20 hover:text-white/70 transition-all"
          >
            ← Learn
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
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
                  <div key={label} className="bg-[#111114] border border-white/10 rounded-xl p-5">
                    <p className="text-xs text-white/30 mb-3">{label}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Accuracy + Streak row */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#111114] border border-white/10 rounded-xl p-5">
                  <p className="text-xs text-white/30 mb-3">Accuracy</p>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-700"
                      style={{ width: `${stats.accuracy}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/20">
                    <span>0%</span>
                    <span>{stats.accuracy}%</span>
                    <span>100%</span>
                  </div>
                </div>
                <div className="bg-[#111114] border border-white/10 rounded-xl p-5">
                  <p className="text-xs text-white/30 mb-3">Streaks</p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-2xl font-bold">{stats.current_streak} 🔥</p>
                      <p className="text-xs text-white/30 mt-1">Current</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white/50">{stats.longest_streak}</p>
                      <p className="text-xs text-white/30 mt-1">Best ever</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard && (
              <div className="bg-[#111114] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Leaderboard 🏆</h2>
                  <span className="text-xs text-white/30">
                    {leaderboard.total_users} total learners
                  </span>
                </div>

                {/* My rank banner */}
                {myRank && (
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-4">
                    <span className="text-white/40 text-xs">Your rank</span>
                    <span className="text-white font-bold text-lg">#{myRank.rank}</span>
                    <span className="text-white/40 text-xs">{myRank.total_xp} XP · {myRank.current_streak}🔥</span>
                  </div>
                )}

                {/* Entries */}
                <div className="flex flex-col gap-2">
                  {leaderboard.entries.map((e, i) => {
                    const isMe = e.user_id === user?.id;
                    return (
                      <div
                        key={e.user_id}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
                          isMe
                            ? "bg-white/5 border-white/15"
                            : "border-white/5 hover:border-white/10"
                        }`}
                      >
                        <span className="w-8 text-center shrink-0">
                          {MEDALS[i] || (
                            <span className="text-xs text-white/30 font-mono">#{e.rank}</span>
                          )}
                        </span>

                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white/60 shrink-0">
                          {e.email?.[0]?.toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isMe ? "text-white" : "text-white/60"}`}>
                            {isMe ? "You" : e.email}
                          </p>
                          <p className="text-xs text-white/25">
                            {e.topics_completed} topics · {e.current_streak}🔥
                          </p>
                        </div>

                        <span className={`text-sm font-bold shrink-0 ${
                          i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-orange-400" : "text-white/50"
                        }`}>
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
    </ProtectedRoute>
  );
}