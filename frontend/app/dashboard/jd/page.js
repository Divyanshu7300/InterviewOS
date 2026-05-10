"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";

const Icon = ({ d, size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const icons = {
  alert: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  jd: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  resume: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6M9 9h2",
  interview: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  stack: "M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
  soft: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  tasks: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  topics: "M8 10h.01M12 10h.01M16 10h.01M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  keywords: "M20 7h-9M14 17H5M17 17h3M5 7h2M7 7a2 2 0 104 0 2 2 0 00-4 0zM13 17a2 2 0 104 0 2 2 0 00-4 0z",
  arrow: "M5 12h14M12 5l7 7-7 7",
};

const colors = {
  sky: { text: "text-sky-300", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.24)" },
  emerald: { text: "text-emerald-300", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.22)" },
  amber: { text: "text-amber-300", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.24)" },
  violet: { text: "text-violet-300", bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.24)" },
  rose: { text: "text-rose-300", bg: "rgba(244, 63, 94, 0.12)", border: "rgba(244, 63, 94, 0.24)" },
};

const QUICK_SIGNALS = [
  { label: "Extract", value: "Skills + stack" },
  { label: "Predict", value: "Interview topics" },
  { label: "Improve", value: "Resume keywords" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay },
});

const Spinner = () => (
  <span
    className="inline-block h-4 w-4 animate-spin rounded-full border-2"
    style={{ borderColor: "rgba(15,23,42,0.22)", borderTopColor: "rgb(15,23,42)" }}
  />
);

function Tag({ children, tone = colors.sky }) {
  return (
    <span
      className={`rounded-[14px] border px-3 py-1.5 text-sm font-semibold ${tone.text}`}
      style={{ background: tone.bg, borderColor: tone.border }}
    >
      {children}
    </span>
  );
}

function JDPanel({ eyebrow, title, description, children, aside }) {
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

function ResultCard({ title, icon, tone = colors.sky, children, delay = 0 }) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className="group relative overflow-hidden rounded-[24px] border p-5"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at top right, ${tone.bg}, transparent 40%)` }}
      />
      <div className="relative mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-[16px] border ${tone.text}`}
            style={{ background: tone.bg, borderColor: tone.border }}
          >
            <Icon d={icons[icon]} size={16} />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {title}
          </p>
        </div>
      </div>
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export default function JDAnalyzer() {
  const router = useRouter();
  const { user } = useAuth() ?? {};
  const userId = user?.id ? parseInt(user.id) : null;

  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const trimmedText = jdText.trim();
  const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0;

  const analyzeJD = async () => {
    if (!trimmedText) return;
    if (!userId) {
      setError("Please log in first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/jd/analyze", {
        jd_text: jdText,
        user_id: userId,
      });
      setResult(res.data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") setError(detail);
      else setError("Failed to analyze JD. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200/80">
                JD Analyzer
              </p>
              <h1 className="mt-3 max-w-3xl text-[36px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[52px]">
                Decode the role before you prepare.
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-200/80 sm:text-[16px]">
                Paste a job description and turn it into a focused prep brief: tech stack, seniority, keywords,
                responsibilities, and likely interview topics.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {QUICK_SIGNALS.map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                Input Preview
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {result?.role_title || (trimmedText ? "Ready to analyze" : "Paste a JD to begin")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                  <div className="rounded-2xl bg-white/6 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Words</p>
                    <p className="mt-1 text-base font-bold text-white">{wordCount}</p>
                  </div>
                  <div className="rounded-2xl bg-white/6 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Output</p>
                    <p className="mt-1 text-base font-bold text-white">Prep brief</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.div {...fadeUp(0.08)}>
          <JDPanel
            eyebrow="Step 1"
            title="Paste the job description"
            description="Use the full JD when possible. More context gives sharper stack extraction, better keyword suggestions, and more useful interview topics."
            aside={
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Best input
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                  Include responsibilities, requirements, preferred qualifications, and company notes if the posting has
                  them.
                </p>
              </div>
            }
          >
            <div className="rounded-[26px] border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the job description here..."
                rows={10}
                className="min-h-[260px] w-full resize-none rounded-[22px] border border-transparent bg-transparent px-3 py-3 text-[15px] leading-7 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <div className="flex flex-col gap-3 border-t border-[var(--border)] px-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[var(--text-muted)]">{wordCount} words ready for analysis</p>
                <button
                  onClick={analyzeJD}
                  disabled={loading || !trimmedText}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[18px] px-5 text-sm font-bold text-white transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background: "var(--brand-gradient)",
                    boxShadow: "0 18px 50px rgba(125, 211, 252, 0.18)",
                  }}
                >
                  {loading ? (
                    <>
                      <Spinner /> Analyzing...
                    </>
                  ) : (
                    "Analyze JD"
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                >
                  <Icon d={icons.alert} size={14} /> {error}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </JDPanel>
        </motion.div>

        {result ? (
          <motion.div {...fadeUp(0.12)}>
            <JDPanel
              eyebrow="Step 2"
              title="Review the extracted role brief"
              description="Use this output as the source of truth for resume matching and mock interviews."
              aside={
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Role signal
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-[var(--text-primary)]">
                    {result.seniority_level || "Unknown seniority"}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                    {result.experience_required || "Experience requirement not specified."}
                  </p>
                </div>
              }
            >
              <ResultCard title="Role Overview" icon="jd" tone={colors.sky} delay={0}>
                <h2 className="text-[28px] font-black tracking-[-0.03em] text-[var(--text-primary)]">
                  {result.role_title}
                </h2>
                <p className="mt-3 text-[15px] leading-7 text-[var(--text-secondary)]">{result.role_summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Tag tone={colors.sky}>{result.seniority_level || "Unknown"}</Tag>
                  <Tag tone={colors.amber}>{result.experience_required || "N/A"}</Tag>
                </div>
              </ResultCard>

              <div className="grid gap-4">
                <ResultCard title="Tech Stack" icon="stack" tone={colors.sky} delay={0.05}>
                  <div className="flex flex-wrap gap-2">
                    {result.tech_stack?.map((item) => (
                      <Tag key={item} tone={colors.sky}>{item}</Tag>
                    ))}
                  </div>
                </ResultCard>

                <ResultCard title="Soft Skills" icon="soft" tone={colors.violet} delay={0.08}>
                  <ul className="flex flex-col gap-2">
                    {result.soft_skills?.map((item, index) => (
                      <li key={index} className="text-sm leading-6 text-[var(--text-secondary)]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </ResultCard>

                <ResultCard title="Key Responsibilities" icon="tasks" tone={colors.emerald} delay={0.11}>
                  <ul className="flex flex-col gap-2">
                    {result.key_responsibilities?.map((item, index) => (
                      <li key={index} className="text-sm leading-6 text-[var(--text-secondary)]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </ResultCard>

                <ResultCard title="Interview Topics" icon="topics" tone={colors.amber} delay={0.14}>
                  <ul className="flex flex-col gap-2">
                    {result.interview_topics?.map((item, index) => (
                      <li key={index} className="text-sm leading-6 text-[var(--text-secondary)]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </ResultCard>
              </div>

              <ResultCard title="Resume Keywords" icon="keywords" tone={colors.emerald} delay={0.17}>
                <div className="flex flex-wrap gap-2">
                  {result.resume_keywords?.map((item) => (
                    <Tag key={item} tone={colors.emerald}>{item}</Tag>
                  ))}
                </div>
              </ResultCard>
            </JDPanel>
          </motion.div>
        ) : null}

        {result ? (
          <motion.section
            {...fadeUp(0.2)}
            className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[0_28px_80px_rgba(3,7,18,0.24)] sm:p-6"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(56,189,248,0.08), rgba(245,158,11,0.08) 55%, rgba(16,185,129,0.08))",
              }}
            />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Next Step
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--text-primary)]">
                  Use this JD across your prep loop
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                  Match your resume against this role, then start a mock interview with the same context.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => router.push("/dashboard/resume")}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] px-5 text-sm font-bold text-[var(--text-primary)]"
                >
                  Upload Resume
                </button>
                <button
                  onClick={() => router.push("/dashboard/interview")}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-[20px] px-5 text-sm font-bold text-white"
                  style={{
                    background: "var(--brand-gradient)",
                    boxShadow: "0 18px 50px rgba(125, 211, 252, 0.18)",
                  }}
                >
                  Start Interview
                </button>
              </div>
            </div>
          </motion.section>
        ) : null}
      </div>
    </div>
  );
}
