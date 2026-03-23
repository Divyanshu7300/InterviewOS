"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/axios";
import { useAuth } from "../../../context/AuthContext";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { motion } from "framer-motion";

const LEVEL = {
  BEGINNER:     { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  INTERMEDIATE: { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   dot: "bg-amber-400"   },
  ADVANCED:     { text: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20",    dot: "bg-rose-400"    },
};

function SkeletonCard() {
  return (
    <div className="h-36 rounded-2xl animate-pulse" style={{ background: "var(--bg-secondary)" }} />
  );
}

export default function LearnPage() {
  const router     = useRouter();
  const { user }   = useAuth();

  const [skills,         setSkills]         = useState([]);
  const [selectedSkill,  setSelectedSkill]  = useState(null);
  const [topics,         setTopics]         = useState({ beginner: [], intermediate: [], advanced: [] });
  const [loadingSkills,  setLoadingSkills]  = useState(true);
  const [loadingTopics,  setLoadingTopics]  = useState(false);
  const [error,          setError]          = useState(null);

  useEffect(() => {
    api.get("/learn/skills")
      .then(r => {
        setSkills(r.data);
        if (r.data.length > 0) fetchTopics(r.data[0]);
      })
      .catch(() => setError("Failed to load skills."))
      .finally(() => setLoadingSkills(false));
  }, []);

  const fetchTopics = (skill) => {
    setSelectedSkill(skill);
    setLoadingTopics(true);
    setError(null);
    const uid = user?.id;
    api.get(`/learn/skills/${skill.id}/topics${uid ? `?user_id=${uid}` : ""}`)
      .then(r => setTopics(r.data))
      .catch(() => setError("Failed to load topics."))
      .finally(() => setLoadingTopics(false));
  };

  const allTopics = [
    ...topics.beginner.map(t     => ({ ...t, level: "BEGINNER" })),
    ...topics.intermediate.map(t => ({ ...t, level: "INTERMEDIATE" })),
    ...topics.advanced.map(t     => ({ ...t, level: "ADVANCED" })),
  ];

  const completedCount = allTopics.filter(t => t.completed).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-24 px-5"
        style={{ paddingTop: "72px", background: "var(--bg-primary)" }}>
        <div className="max-w-5xl mx-auto flex flex-col gap-8">

          {/* ── HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="pt-6 flex items-start justify-between gap-4"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: "var(--text-muted)" }}>
                Learning
              </p>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                Skills & Topics
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Pick a skill, choose a topic, take the quiz — earn XP.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/learn/stats")}
              className="flex-shrink-0 text-[12px] font-semibold px-4 py-2 rounded-xl border transition-all"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-card)" }}
            >
              My Stats →
            </button>
          </motion.div>

          {/* ── ERROR ── */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-rose-400 text-sm font-medium bg-rose-500/10 border border-rose-500/20">
              ⚠ {error}
            </div>
          )}

          {/* ── SKILL TABS ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="flex flex-wrap gap-2"
          >
            {loadingSkills
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 w-24 rounded-xl animate-pulse"
                    style={{ background: "var(--bg-secondary)" }} />
                ))
              : skills.map(skill => {
                  const active = selectedSkill?.id === skill.id;
                  return (
                    <button
                      key={skill.id}
                      onClick={() => fetchTopics(skill)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150"
                      style={{
                        background:  active ? "var(--text-primary)" : "var(--bg-card)",
                        color:       active ? "var(--bg-primary)"   : "var(--text-muted)",
                        borderColor: active ? "var(--text-primary)" : "var(--border)",
                      }}
                    >
                      {skill.icon && <span className="mr-1.5">{skill.icon}</span>}
                      {skill.name}
                    </button>
                  );
                })
            }
          </motion.div>

          {/* ── PROGRESS SUMMARY ── */}
          {!loadingTopics && allTopics.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center gap-4 px-5 py-3 rounded-xl border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    {selectedSkill?.name} Progress
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                    {completedCount} / {allTopics.length} topics
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <motion.div
                    className="h-full rounded-full bg-emerald-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${allTopics.length ? (completedCount / allTopics.length) * 100 : 0}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── TOPICS ── */}
          {loadingTopics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : allTopics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                No topics available for this skill yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map(lvl => {
                const lvlTopics = allTopics.filter(t => t.level === lvl);
                if (!lvlTopics.length) return null;
                const c = LEVEL[lvl];
                return (
                  <motion.div key={lvl}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}>

                    {/* Level header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                      <span className={`text-[11px] font-bold tracking-widest uppercase ${c.text}`}>
                        {lvl}
                      </span>
                      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                      <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                        {lvlTopics.filter(t => t.completed).length}/{lvlTopics.length} done
                      </span>
                    </div>

                    {/* Topic cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {lvlTopics.map((topic, i) => (
                        <motion.button
                          key={topic.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.04 }}
                          onClick={() => router.push(`/dashboard/learn/quiz/${topic.id}`)}
                          className={`rounded-2xl p-5 text-left flex flex-col gap-3 border transition-all duration-150 group`}
                          style={{
                            background:   "var(--bg-card)",
                            borderColor:  topic.completed ? undefined : "var(--border)",
                          }}
                        >
                          {/* Title + badge */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold leading-snug"
                              style={{ color: "var(--text-primary)" }}>
                              {topic.title}
                            </h3>
                            {topic.completed && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${c.bg} ${c.text} ${c.border}`}>
                                ✓ done
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {topic.description && (
                            <p className="text-[12px] leading-relaxed line-clamp-2"
                              style={{ color: "var(--text-muted)" }}>
                              {topic.description}
                            </p>
                          )}

                          {/* Score bar */}
                          {topic.attempts > 0 && (
                            <div className="w-full h-1 rounded-full overflow-hidden"
                              style={{ background: "var(--border)" }}>
                              <div
                                className={`h-full rounded-full ${c.dot}`}
                                style={{ width: `${Math.round((topic.best_score || 0) * 100)}%`, opacity: 0.7 }}
                              />
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-[11px] font-semibold"
                              style={{ color: "var(--text-muted)" }}>
                              +{topic.xp_reward} XP
                            </span>
                            <span className="text-[11px] font-semibold transition-colors"
                              style={{ color: "var(--text-muted)" }}>
                              {topic.completed ? "Retry →" : "Start →"}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}