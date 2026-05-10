"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import api from "../../../lib/axios";
import { useAuth } from "../../../context/AuthContext";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { motion } from "framer-motion";

const tones = {
  BEGINNER: { text: "text-emerald-300", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.22)" },
  INTERMEDIATE: { text: "text-amber-300", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.24)" },
  ADVANCED: { text: "text-rose-300", bg: "rgba(244, 63, 94, 0.12)", border: "rgba(244, 63, 94, 0.24)" },
};

const icons = {
  book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  stats: "M3 3v18h18M7 15l4-4 3 3 5-7",
  check: "M20 6L9 17l-5-5",
};

const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay },
});

const COLLAPSED_SKILL_COUNT = 8;

function Panel({ eyebrow, title, description, children, aside }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[0_24px_80px_rgba(3,7,18,0.24)] sm:p-7">
      <div className="absolute inset-0 opacity-80" style={{ background: "var(--panel-glow)" }} />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{eyebrow}</p>
            <h2 className="mt-2 text-[26px] font-black tracking-[-0.03em] text-[var(--text-primary)]">{title}</h2>
            {description ? <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">{description}</p> : null}
          </div>
          {children}
        </div>
        {aside ? <div className="relative">{aside}</div> : null}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return <div className="h-40 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)]" />;
}

export default function LearnPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [topics, setTopics] = useState({ beginner: [], intermediate: [], advanced: [] });
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [error, setError] = useState(null);
  const [skillsExpanded, setSkillsExpanded] = useState(false);

  useEffect(() => {
    api.get("/learn/skills")
      .then((r) => {
        const initialSkills = r.data || [];
        setSkills(initialSkills);
        if (initialSkills.length > 0) {
          const firstSkill = initialSkills[0];
          setSelectedSkill(firstSkill);
          setLoadingTopics(true);
          const uid = user?.id;
          api.get(`/learn/skills/${firstSkill.id}/topics${uid ? `?user_id=${uid}` : ""}`)
            .then((topicRes) => setTopics(topicRes.data))
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
      .then((r) => setTopics(r.data))
      .catch(() => setError("Failed to load topics."))
      .finally(() => setLoadingTopics(false));
  };

  const allTopics = [
    ...topics.beginner.map((t) => ({ ...t, level: "BEGINNER" })),
    ...topics.intermediate.map((t) => ({ ...t, level: "INTERMEDIATE" })),
    ...topics.advanced.map((t) => ({ ...t, level: "ADVANCED" })),
  ];

  const completedCount = allTopics.filter((t) => t.completed).length;
  const hasOverflowSkills = skills.length > COLLAPSED_SKILL_COUNT;
  const collapsedSkills = skills.slice(0, COLLAPSED_SKILL_COUNT);
  const selectedInCollapsed = collapsedSkills.some((skill) => skill.id === selectedSkill?.id);
  const visibleSkills = !hasOverflowSkills || skillsExpanded
    ? skills
    : selectedSkill && !selectedInCollapsed
      ? [...collapsedSkills.slice(0, COLLAPSED_SKILL_COUNT - 1), selectedSkill]
      : collapsedSkills;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-28 pt-[84px] sm:px-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <motion.section {...fadeUp(0)} className="theme-hero relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-7 shadow-[0_28px_90px_rgba(3,7,18,0.34)] sm:px-8 sm:py-9">
            <div className="absolute inset-0" style={{ background: "var(--hero-surface)" }} />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200/80">Learning</p>
                <h1 className="mt-3 max-w-3xl text-[36px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[52px]">Build skills through focused quiz paths.</h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-200/80 sm:text-[16px]">Pick a skill, choose a topic, take the quiz, and turn weak areas into measurable progress.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Skills", value: loadingSkills ? "-" : skills.length },
                    { label: "Topics", value: loadingTopics ? "-" : allTopics.length },
                    { label: "Done", value: loadingTopics ? "-" : completedCount },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">Active Skill</p>
                <p className="mt-5 text-lg font-bold text-white">{selectedSkill?.name || "Loading skills"}</p>
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Progress</p>
                  <p className="mt-1 text-base font-bold text-white">{completedCount} / {allTopics.length || 0} topics</p>
                </div>
                <button onClick={() => router.push("/dashboard/learn/stats")} className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[18px] px-4 text-sm font-bold text-white" style={{ background: "var(--brand-gradient)" }}>
                  <Icon d={icons.stats} size={15} /> My Stats
                </button>
              </div>
            </div>
          </motion.section>

          {error ? <div className="rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div> : null}

          <motion.div {...fadeUp(0.08)}>
            <Panel
              eyebrow="Skill Library"
              title="Choose a skill"
              description="The selected skill controls which beginner, intermediate, and advanced topics appear below."
              aside={<div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5 text-sm leading-7 text-[var(--text-secondary)]">Work through topics in order, or jump straight to the area you want to test.</div>}
            >
              <div className="flex flex-wrap gap-2">
                {loadingSkills
                  ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 w-28 animate-pulse rounded-[16px] bg-[var(--bg-secondary)]" />)
                  : visibleSkills.map((skill) => {
                      const active = selectedSkill?.id === skill.id;
                      return (
                        <button
                          key={skill.id}
                          onClick={() => fetchTopics(skill)}
                          className="flex min-h-[42px] items-center gap-2 rounded-[16px] border px-4 text-sm font-bold transition-all hover:-translate-y-0.5"
                          style={{
                            background: active ? "var(--selected-bg)" : "var(--bg-secondary)",
                            borderColor: active ? "var(--selected-border)" : "var(--border)",
                            color: "var(--text-primary)",
                            boxShadow: active ? "0 14px 36px var(--selected-ring)" : "none",
                          }}
                        >
                          {skill.logo_url ? <Image src={skill.logo_url} alt={`${skill.name} logo`} width={16} height={16} unoptimized className="h-4 w-4 object-contain" /> : null}
                          {skill.name}
                        </button>
                      );
                    })}
              </div>
              {!loadingSkills && hasOverflowSkills ? (
                <button onClick={() => setSkillsExpanded((prev) => !prev)} className="w-fit rounded-[16px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-bold text-[var(--text-primary)]">
                  {skillsExpanded ? "Show Less" : `Show All Skills (${skills.length})`}
                </button>
              ) : null}
            </Panel>
          </motion.div>

          <motion.div {...fadeUp(0.14)}>
            <Panel
              eyebrow="Topics"
              title={selectedSkill ? `${selectedSkill.name} topics` : "Topics"}
              description="Each topic has a short quiz and XP reward. Completed topics can be retried."
              aside={
                !loadingTopics && allTopics.length > 0 ? (
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Progress</p>
                    <p className="mt-3 text-xl font-black text-[var(--text-primary)]">{completedCount} / {allTopics.length}</p>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--border)]">
                      <motion.div className="h-full rounded-full" style={{ background: "var(--brand-gradient-strong)" }} initial={{ width: 0 }} animate={{ width: `${(completedCount / allTopics.length) * 100}%` }} transition={{ duration: 0.8 }} />
                    </div>
                  </div>
                ) : null
              }
            >
              {loadingTopics ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
              ) : allTopics.length === 0 ? (
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-14 text-center text-sm font-semibold text-[var(--text-secondary)]">No topics available for this skill yet.</div>
              ) : (
                <div className="flex flex-col gap-7">
                  {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((lvl) => {
                    const lvlTopics = allTopics.filter((t) => t.level === lvl);
                    if (!lvlTopics.length) return null;
                    const tone = tones[lvl];
                    return (
                      <div key={lvl}>
                        <div className="mb-4 flex items-center gap-3">
                          <span className={`rounded-[14px] border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${tone.text}`} style={{ background: tone.bg, borderColor: tone.border }}>{lvl}</span>
                          <div className="h-px flex-1 bg-[var(--border)]" />
                          <span className="text-sm font-bold text-[var(--text-secondary)]">{lvlTopics.filter((t) => t.completed).length}/{lvlTopics.length} done</span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {lvlTopics.map((topic, i) => (
                            <motion.button
                              key={topic.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: i * 0.04 }}
                              onClick={() => router.push(`/dashboard/learn/quiz/${topic.id}`)}
                              className="group relative overflow-hidden rounded-[24px] border p-5 text-left transition-all hover:-translate-y-1"
                              style={{ background: "var(--bg-secondary)", borderColor: topic.completed ? tone.border : "var(--border)" }}
                            >
                              <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ background: `radial-gradient(circle at top right, ${tone.bg}, transparent 40%)` }} />
                              <div className="relative flex items-start justify-between gap-3">
                                <h3 className="text-base font-black leading-snug text-[var(--text-primary)]">{topic.title}</h3>
                                {topic.completed ? <span className={`rounded-[12px] border px-2 py-1 text-[10px] font-bold ${tone.text}`} style={{ background: tone.bg, borderColor: tone.border }}>Done</span> : null}
                              </div>
                              {topic.description ? <p className="relative mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">{topic.description}</p> : null}
                              {topic.attempts > 0 ? <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-[var(--border)]"><div className="h-full rounded-full" style={{ width: `${Math.round((topic.best_score || 0) * 100)}%`, background: tone.border }} /></div> : null}
                              <div className="relative mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
                                <span className={`text-sm font-bold ${tone.text}`}>+{topic.xp_reward} XP</span>
                                <span className="text-sm font-bold text-[var(--text-primary)]">{topic.completed ? "Retry" : "Start"}</span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
