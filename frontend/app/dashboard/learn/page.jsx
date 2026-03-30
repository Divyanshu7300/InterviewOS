"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
    <div className="h-36 animate-pulse rounded-2xl bg-[var(--bg-secondary)]" />
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
        const initialSkills = r.data || [];
        setSkills(initialSkills);
        if (initialSkills.length > 0) {
          const firstSkill = initialSkills[0];
          setSelectedSkill(firstSkill);
          setLoadingTopics(true);
          const uid = user?.id;
          api.get(`/learn/skills/${firstSkill.id}/topics${uid ? `?user_id=${uid}` : ""}`)
            .then(topicRes => setTopics(topicRes.data))
            .catch(() => setError("Failed to load topics."))
            .finally(() => setLoadingTopics(false));
        }
      })
      .catch(() => setError("Failed to load skills."))
      .finally(() => setLoadingSkills(false));
  }, [user?.id]);

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

  const refreshSkills = async (preferredSkillId = null) => {
    const res = await api.get("/learn/skills");
    const nextSkills = res.data || [];
    setSkills(nextSkills);
    if (!nextSkills.length) return;

    const nextSelected = preferredSkillId
      ? nextSkills.find((item) => item.id === preferredSkillId)
      : selectedSkill
        ? nextSkills.find((item) => item.id === selectedSkill.id)
        : nextSkills[0];

    if (nextSelected) fetchTopics(nextSelected);
  };

  const allTopics = [
    ...topics.beginner.map(t     => ({ ...t, level: "BEGINNER" })),
    ...topics.intermediate.map(t => ({ ...t, level: "INTERMEDIATE" })),
    ...topics.advanced.map(t     => ({ ...t, level: "ADVANCED" })),
  ];

  const completedCount = allTopics.filter(t => t.completed).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] px-5 pb-24 pt-[72px]">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">

          {/* ── HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="pt-6 flex items-start justify-between gap-4"
          >
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-primary)]">
                Learning
              </p>
              <h1 className="text-[32px] font-bold text-[var(--text-primary)]">
                Skills & Topics
              </h1>
              <p className="mt-2 text-base text-[var(--text-primary)]">
                Pick a skill, choose a topic, take the quiz — earn XP.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/learn/stats")}
              className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-[12px] font-semibold text-[var(--text-primary)] transition-all"
            >
              My Stats →
            </button>
          </motion.div>

          {/* Similar skills feature temporarily hidden until the generation flow is reworked. */}
          {/* {selectedSkill && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4"
            >
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-primary)]">
                  Skill Expansion
                </p>
                <p className="text-base text-[var(--text-primary)]">
                  Generate adjacent skills similar to {selectedSkill.name} with starter topics.
                </p>
              </div>
              <button
                onClick={generateSimilar}
                disabled={generatingSkills}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-[12px] font-semibold text-[var(--text-primary)] transition-all disabled:opacity-50"
              >
                {generatingSkills ? "Generating..." : "Generate Similar Skills"}
              </button>
            </motion.div>
          )} */}

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
                  <div key={i} className="h-9 w-24 animate-pulse rounded-xl bg-[var(--bg-secondary)]" />
                ))
              : skills.map(skill => {
                  const active = selectedSkill?.id === skill.id;
                  return (
                    <button
                      key={skill.id}
                      onClick={() => fetchTopics(skill)}
                    className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-150"
                      style={{
                        background:  active ? "var(--text-primary)" : "var(--bg-card)",
                        color:       active ? "var(--bg-primary)"   : "var(--text-primary)",
                        borderColor: active ? "var(--text-primary)" : "var(--border)",
                      }}
                    >
                      {skill.logo_url ? (
                        <Image
                          src={skill.logo_url}
                          alt={`${skill.name} logo`}
                          width={16}
                          height={16}
                          unoptimized
                          className="h-4 w-4 object-contain"
                          style={{ filter: active && skill.slug === "nextjs" ? "invert(1)" : "none" }}
                        />
                      ) : skill.icon ? (
                        <span>{skill.icon}</span>
                      ) : null}
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
              className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-3"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {selectedSkill?.name} Progress
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {completedCount} / {allTopics.length} topics
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-16">
              <p className="text-sm font-medium text-[var(--text-primary)]">
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
                      <span className="text-sm font-medium text-[var(--text-primary)]">
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
                            <p className="text-sm leading-relaxed line-clamp-2"
                              style={{ color: "var(--text-primary)" }}>
                              {topic.description}
                            </p>
                          )}

                          {/* Score bar */}
                          {topic.attempts > 0 && (
                            <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--border)]">
                              <div
                                className={`h-full rounded-full ${c.dot}`}
                                style={{ width: `${Math.round((topic.best_score || 0) * 100)}%`, opacity: 0.7 }}
                              />
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-sm font-semibold"
                              style={{ color: "var(--text-primary)" }}>
                              +{topic.xp_reward} XP
                            </span>
                            <span className="text-sm font-semibold transition-colors"
                              style={{ color: "var(--text-primary)" }}>
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
