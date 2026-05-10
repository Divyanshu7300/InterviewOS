"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../lib/axios";
import { useAuth } from "../../../context/AuthContext";
import JDSelector from "../../../components/JDSelector";

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
  resume: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6M9 9h2",
  jd: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  score: "M3 3v18h18M7 15l4-4 3 3 5-7",
  match: "M20 6L9 17l-5-5",
  missing: "M18 6L6 18M6 6l12 12",
  weak: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  skills: "M20 7h-9M14 17H5M17 17h3M5 7h2M7 7a2 2 0 104 0 2 2 0 00-4 0zM13 17a2 2 0 104 0 2 2 0 00-4 0z",
  suggestions: "M9 18h6M10 22h4M12 2a7 7 0 00-4 12.74V17h8v-2.26A7 7 0 0012 2z",
  refresh: "M21 12a9 9 0 11-2.64-6.36M21 3v6h-6",
};

const colors = {
  sky: { text: "text-sky-300", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.24)" },
  emerald: { text: "text-emerald-300", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.22)" },
  amber: { text: "text-amber-300", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.24)" },
  violet: { text: "text-violet-300", bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.24)" },
  rose: { text: "text-rose-300", bg: "rgba(244, 63, 94, 0.12)", border: "rgba(244, 63, 94, 0.24)" },
};

const QUICK_SIGNALS = [
  { label: "Compare", value: "Resume vs JD" },
  { label: "Score", value: "ATS + role fit" },
  { label: "Improve", value: "Skills + fixes" },
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

function Tag({ label, tone = colors.emerald }) {
  return (
    <span
      className={`rounded-[14px] border px-3 py-1.5 text-sm font-semibold ${tone.text}`}
      style={{ background: tone.bg, borderColor: tone.border }}
    >
      {label}
    </span>
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
      <div className="relative mb-4 flex items-center gap-3">
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
      <div className="relative">{children}</div>
    </motion.div>
  );
}

function ScoreBar({ label, value, max = 100 }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const tone = pct >= 70 ? colors.emerald : pct >= 40 ? colors.amber : colors.rose;

  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
        <span className={`text-sm font-black ${tone.text}`}>{value}/{max}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[var(--border)]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${tone.bg}, ${tone.border}, currentColor)`, color: tone.border }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </div>
  );
}

export default function ResumeAnalyzer() {
  const { user } = useAuth();

  const [jdId, setJdId] = useState(null);
  const [selectedJD, setSelectedJD] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const fileSizeKb = file ? (file.size / 1024).toFixed(0) : 0;

  const uploadResume = async () => {
    if (!file) return setError("Please select a PDF file.");
    if (!jdId) return setError("Please select a Job Description.");
    if (!user?.id) return setError("Please login again.");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post(
        `/resumes/upload?user_id=${parseInt(user.id)}&jd_id=${jdId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResult(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Resume upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const nextFile = e.dataTransfer.files[0];
    if (nextFile?.type === "application/pdf") {
      setFile(nextFile);
      setError(null);
    } else {
      setError("Only PDF files allowed.");
    }
  };

  const reset = () => {
    setResult(null);
    setFile(null);
    setError(null);
    setJdId(null);
    setSelectedJD(null);
  };

  const analysis = result?.analysis ?? {};
  const detectedSkills = result?.skills ? Object.entries(result.skills).sort((a, b) => b[1] - a[1]).slice(0, 12) : [];

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
                Resume Analysis
              </p>
              <h1 className="mt-3 max-w-3xl text-[36px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[52px]">
                Match your resume against the exact role.
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-200/80 sm:text-[16px]">
                Select a JD, upload your PDF resume, and get ATS fit, role match, missing skills, weak areas, and
                practical improvement suggestions.
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
                Analysis Preview
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {selectedJD?.role_title || result?.role_title || "Select a JD"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                  <div className="rounded-2xl bg-white/6 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Resume</p>
                    <p className="mt-1 truncate text-base font-bold text-white">{file ? `${fileSizeKb} KB` : "No file"}</p>
                  </div>
                  <div className="rounded-2xl bg-white/6 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Output</p>
                    <p className="mt-1 text-base font-bold text-white">{result ? "Ready" : "Fit report"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <AnimatePresence>
          {error ? (
            <motion.div
              {...fadeUp(0)}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2 rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
            >
              <Icon d={icons.alert} size={14} /> {error}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!result ? (
          <>
            <motion.div {...fadeUp(0.08)}>
              <Panel
                eyebrow="Step 1"
                title="Select the role context"
                description="Pick the JD you want your resume measured against. This keeps the resume review aligned with your interview setup."
                aside={
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Why it matters
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                      A specific JD lets the analyzer separate strong matches from role-specific gaps.
                    </p>
                  </div>
                }
              >
                <JDSelector
                  selectedId={jdId}
                  onSelect={(nextId, jd) => {
                    setJdId(nextId);
                    setSelectedJD(jd || null);
                  }}
                  placeholder="Choose a JD to compare against."
                  title="Match your resume against the exact role"
                  description="Use the same role card here and in Interview Setup so your resume review and practice interview stay in sync."
                />
              </Panel>
            </motion.div>

            <motion.div {...fadeUp(0.14)}>
              <Panel
                eyebrow="Step 2"
                title="Upload your resume"
                description="Drop a PDF or click to browse. The report will compare it directly against the selected job description."
                aside={
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      File rules
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                      PDF only. Keep it clean, current, and focused on the role you selected.
                    </p>
                  </div>
                }
              >
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("resume-input")?.click()}
                  className="relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-[26px] border px-4 py-12 text-center transition-all sm:px-6"
                  style={{
                    borderColor: dragOver || file ? colors.sky.border : "var(--border)",
                    background: dragOver || file ? colors.sky.bg : "var(--bg-secondary)",
                  }}
                >
                  <input
                    id="resume-input"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const nextFile = e.target.files[0];
                      if (nextFile) {
                        setFile(nextFile);
                        setError(null);
                      }
                    }}
                  />
                  <span className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-sky-300/25 bg-sky-400/10 text-sky-300">
                    <Icon d={file ? icons.resume : icons.upload} size={22} />
                  </span>
                  {file ? (
                    <div>
                      <p className="text-lg font-bold text-[var(--text-primary)]">{file.name}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{fileSizeKb} KB · Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-bold text-[var(--text-primary)]">Drop PDF here or click to browse</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">PDF only · Recommended under 10MB</p>
                    </div>
                  )}
                </div>
              </Panel>
            </motion.div>

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
                <div className="grid gap-3 sm:grid-cols-3 lg:flex lg:items-center lg:gap-3">
                  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Role</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {selectedJD?.role_title || "Select a JD"}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Resume</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{file ? file.name : "Upload PDF"}</p>
                  </div>
                  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Report</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">ATS + gaps</p>
                  </div>
                </div>

                <button
                  onClick={uploadResume}
                  disabled={loading || !file || !jdId}
                  className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-[22px] px-6 text-base font-bold text-white transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
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
                    "Analyze Resume"
                  )}
                </button>
              </div>
            </motion.section>
          </>
        ) : null}

        {result ? (
          <>
            <motion.div {...fadeUp(0.08)}>
              <Panel
                eyebrow="Score Overview"
                title="How your resume fits this role"
                description="Use these scores as directional signals, then inspect the skills and suggestions below for the actual fixes."
                aside={
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Report status
                    </p>
                    <h3 className="mt-3 text-xl font-bold text-[var(--text-primary)]">Analysis complete</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                      Run a new analysis whenever you update the resume or switch the JD.
                    </p>
                    <button
                      onClick={reset}
                      className="mt-4 inline-flex min-h-[42px] items-center gap-2 rounded-[16px] border border-[var(--border)] bg-[var(--bg-card)] px-4 text-sm font-bold text-[var(--text-primary)]"
                    >
                      <Icon d={icons.refresh} size={13} /> New Analysis
                    </button>
                  </div>
                }
              >
                <ResultCard title="Scores" icon="score" tone={colors.sky}>
                  <div className="grid gap-3">
                    <ScoreBar label="ATS Score" value={analysis.ats_score ?? 0} max={100} />
                    <ScoreBar label="Role Match" value={analysis.role_match ?? 0} max={100} />
                    <ScoreBar label="Experience Match" value={analysis.experience_match ?? 0} max={100} />
                  </div>
                </ResultCard>
              </Panel>
            </motion.div>

            <motion.div {...fadeUp(0.14)}>
              <Panel
                eyebrow="Skill Match"
                title="Matched, missing, and weak skills"
                description="This section shows what the resume already signals clearly and where the JD expects more evidence."
                aside={
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Fix order
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                      Start with missing role keywords, then strengthen weak skills with concrete project impact.
                    </p>
                  </div>
                }
              >
                <div className="grid gap-4">
                  <ResultCard title="Matched Skills" icon="match" tone={colors.emerald} delay={0}>
                    <div className="flex flex-wrap gap-2">
                      {analysis.matched_skills?.length > 0
                        ? analysis.matched_skills.map((skill) => <Tag key={skill} label={skill} tone={colors.emerald} />)
                        : <p className="text-sm text-[var(--text-secondary)]">None found.</p>}
                    </div>
                  </ResultCard>

                  <ResultCard title="Missing Skills" icon="missing" tone={colors.rose} delay={0.04}>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missing_skills?.length > 0
                        ? analysis.missing_skills.map((skill) => <Tag key={skill} label={skill} tone={colors.rose} />)
                        : <p className="text-sm text-[var(--text-secondary)]">None found.</p>}
                    </div>
                  </ResultCard>

                  <ResultCard title="Weak Skills" icon="weak" tone={colors.amber} delay={0.08}>
                    <div className="flex flex-wrap gap-2">
                      {analysis.weak_skills?.length > 0
                        ? analysis.weak_skills.map((skill) => <Tag key={skill} label={skill} tone={colors.amber} />)
                        : <p className="text-sm text-[var(--text-secondary)]">None found.</p>}
                    </div>
                  </ResultCard>

                  {/* {detectedSkills.length > 0 ? (
                    <ResultCard title="Detected Skills" icon="skills" tone={colors.violet} delay={0.12}>
                      <div className="flex flex-wrap gap-2">
                        {detectedSkills.map(([skill, score]) => (
                          <Tag key={skill} label={`${skill} · ${score}`} tone={colors.violet} />
                        ))}
                      </div>
                    </ResultCard>
                  ) : null} */}
                </div>
              </Panel>
            </motion.div>

            {analysis.improvement_suggestions?.length > 0 ? (
              <motion.div {...fadeUp(0.2)}>
                <Panel
                  eyebrow="Improvement Suggestions"
                  title="What to improve before applying"
                  description="Turn these into resume edits, then rerun the analysis to check whether the role fit improves."
                  aside={
                    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        Next loop
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                        After updating your resume, use the same JD in Interview Lab for focused practice.
                      </p>
                    </div>
                  }
                >
                  <ResultCard title="Suggestions" icon="suggestions" tone={colors.sky}>
                    <ul className="flex flex-col gap-3">
                      {analysis.improvement_suggestions.map((suggestion, index) => (
                        <li key={index} className="flex gap-3 text-sm font-bold leading-7 text-[var(--text-secondary)]">
                          <span className="mt-0.5 shrink-0 font-mono text-xs text-[var(--text-muted)]">
                            {String(index + 1).padStart(2, "0")}.
                          </span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </ResultCard>
                </Panel>
              
              </motion.div>
              
            ) : null}
          <motion.section
            {...fadeUp(0.24)}
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
                  Continue your interview preparation
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                  Use this analyzed resume and JD context to start a focused mock interview experience.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={reset}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] px-5 text-sm font-bold text-[var(--text-primary)]"
                >
                  New Analysis
                </button>

                <button
                  onClick={() => window.location.href = "/dashboard/interview"}
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
          </>
        ) : null}
      </div>
    </div>
  );
}
