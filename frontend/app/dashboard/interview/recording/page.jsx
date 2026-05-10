"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ProtectedRoute from "../../../../components/ProtectedRoute";

const checklist = [
  "Eye contact with camera",
  "Clear and confident voice",
  "No excessive filler words",
  "Good posture and body language",
  "Structured answers",
  "Technical accuracy",
  "Balanced response time",
  "Professional appearance",
];

const SELF_RATING_META = {
  confidence: { label: "How confident did you sound?", accent: "#a78bfa" },
  clarity: { label: "How structured was your answer?", accent: "#f59e0b" },
  depth: { label: "How deep was your technical reasoning?", accent: "#38bdf8" },
  correctness: { label: "How accurate were your answers?", accent: "#4ade80" },
};
const RECORDING_DB_NAME = "interviewos-recordings";
const RECORDING_STORE_NAME = "recordings";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay },
});

const gapLabel = (gap) => {
  if (gap >= 1.5) return "Overconfident";
  if (gap <= -1.5) return "Undersold";
  return "Aligned";
};

function openRecordingDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = indexedDB.open(RECORDING_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RECORDING_STORE_NAME)) {
        db.createObjectStore(RECORDING_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadLatestRecording() {
  const db = await openRecordingDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RECORDING_STORE_NAME, "readonly");
    const request = tx.objectStore(RECORDING_STORE_NAME).get("latest");
    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

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

function MetricCard({ label, value, tone = "text-sky-300" }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className={`mt-5 text-[30px] font-black leading-none ${tone}`}>{value}</p>
    </div>
  );
}

export default function InterviewRecordingPage() {
  const router = useRouter();
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [recordingLoading, setRecordingLoading] = useState(true);
  const [session] = useState(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("interviewSession");
    const resultRaw = sessionStorage.getItem("interviewResult");
    return raw ? JSON.parse(raw) : resultRaw ? JSON.parse(resultRaw) : null;
  });
  const [checked, setChecked] = useState([]);
  const [selfRating, setSelfRating] = useState({
    confidence: 6,
    clarity: 6,
    depth: 6,
    correctness: 6,
  });

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    const loadRecording = async () => {
      try {
        const saved = await loadLatestRecording();
        if (!active) return;

        if (saved?.blob) {
          objectUrl = URL.createObjectURL(saved.blob);
          setRecordedUrl(objectUrl);
          sessionStorage.setItem("recordingUrl", objectUrl);
        }
      } catch {
        const existingUrl = sessionStorage.getItem("recordingUrl");
        if (active && existingUrl) setRecordedUrl(existingUrl);
      } finally {
        if (active) setRecordingLoading(false);
      }
    };

    loadRecording();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  const toggleCheck = (item) =>
    setChecked((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);

  const downloadRecording = () => {
    if (!recordedUrl) return;
    const a = document.createElement("a");
    a.href = recordedUrl;
    a.download = `interview-${session?.sessionId || "session"}.webm`;
    a.click();
  };

  const completionPct = Math.round((checked.length / checklist.length) * 100);
  const reflectionTone = completionPct >= 75
    ? "Strong self-review. Repeat the same questions with sharper delivery."
    : completionPct >= 40
      ? "Good pass. Rewatch once more and note exactly where structure dropped."
      : "Start with the basics and mark the easiest misses first.";
  const aiScores = session?.session_insights?.skill_scores || {};
  const ratingGaps = Object.keys(SELF_RATING_META).map((metric) => {
    const ai = aiScores[metric] ?? 0;
    const self = selfRating[metric];
    return { metric, ai, self, gap: Number((self - ai).toFixed(1)), label: gapLabel(self - ai) };
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-28 pt-[84px] sm:px-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <motion.section {...fadeUp(0)} className="theme-hero relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-7 shadow-[0_28px_90px_rgba(3,7,18,0.34)] sm:px-8 sm:py-9">
            <div className="absolute inset-0" style={{ background: "var(--hero-surface)" }} />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200/80">Recording Review</p>
                <h1 className="mt-3 max-w-3xl text-[36px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[52px]">
                  Rewatch the room, then tighten the delivery.
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-200/80 sm:text-[16px]">
                  Review your interview recording, mark delivery signals, and compare your self-rating with AI scoring.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Recording", value: recordingLoading ? "Loading" : recordedUrl ? "Ready" : "Missing" },
                    { label: "Checklist", value: `${checked.length}/${checklist.length}` },
                    { label: "Review", value: `${completionPct}% done` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">Session Preview</p>
                <p className="mt-5 text-lg font-bold text-white">{session?.roleTitle || "Interview Recording"}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200/80">{recordingLoading ? "Checking browser storage..." : recordedUrl ? "Recording is available for review." : "No saved recording found yet."}</p>
                <button onClick={() => router.push("/dashboard/interview")} className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-[18px] px-4 text-sm font-bold text-white" style={{ background: "var(--brand-gradient)" }}>
                  Back to Interview
                </button>
              </div>
            </div>
          </motion.section>

          {recordingLoading ? (
            <motion.div {...fadeUp(0.08)}>
              <Panel eyebrow="Loading" title="Finding your recording" description="Checking browser storage for the saved interview video." />
            </motion.div>
          ) : !recordedUrl ? (
            <motion.div {...fadeUp(0.08)}>
              <Panel eyebrow="Empty State" title="No recording found" description="Record your next interview session to review it here.">
                <button onClick={() => router.push("/dashboard/interview")} className="inline-flex min-h-[52px] w-fit items-center justify-center rounded-[20px] px-5 text-sm font-bold text-white" style={{ background: "var(--brand-gradient)" }}>
                  Start an Interview
                </button>
              </Panel>
            </motion.div>
          ) : (
            <>
              <motion.div {...fadeUp(0.08)}>
                <Panel
                  eyebrow="Video"
                  title="Watch your session back"
                  description="Use the recording to catch body language, pacing, and delivery patterns that text feedback can miss."
                  aside={<div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5 text-sm leading-7 text-[var(--text-secondary)]">{reflectionTone}</div>}
                >
                  <div className="overflow-hidden rounded-[26px] border border-[var(--border)] bg-black">
                    <video src={recordedUrl} controls className="block w-full" style={{ maxHeight: 520 }} />
                  </div>
                  <button onClick={downloadRecording} className="w-fit rounded-[18px] border border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-3 text-sm font-bold text-[var(--text-primary)]">
                    Download Recording
                  </button>
                </Panel>
              </motion.div>

              <motion.div {...fadeUp(0.14)}>
                <Panel
                  eyebrow="Checklist"
                  title="Self evaluation"
                  description="Mark the delivery and structure signals you want to carry into the next attempt."
                  aside={<MetricCard label="Review Complete" value={`${completionPct}%`} tone={completionPct >= 75 ? "text-emerald-300" : "text-amber-300"} />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {checklist.map((item) => {
                      const done = checked.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleCheck(item)}
                          className="flex items-center gap-3 rounded-[20px] border px-4 py-3.5 text-left transition-all hover:-translate-y-0.5"
                          style={{ background: done ? "var(--selected-bg)" : "var(--bg-secondary)", borderColor: done ? "var(--selected-border)" : "var(--border)", boxShadow: done ? "0 14px 36px var(--selected-ring)" : "none" }}
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[8px] border text-xs font-black" style={{ background: done ? "var(--brand-gradient)" : "transparent", borderColor: done ? "var(--selected-border)" : "var(--border)", color: done ? "#fff" : "var(--text-primary)" }}>
                            {done ? "✓" : ""}
                          </span>
                          <span className="text-sm leading-6 text-[var(--text-primary)]">{item}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                    <div className="mb-3 flex justify-between text-sm font-bold text-[var(--text-primary)]"><span>Reflection meter</span><span>{checked.length}/{checklist.length}</span></div>
                    <div className="h-3 overflow-hidden rounded-full bg-[var(--border)]">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completionPct}%`, background: "var(--brand-gradient-strong)" }} />
                    </div>
                  </div>
                </Panel>
              </motion.div>

              <motion.div {...fadeUp(0.2)}>
                <Panel eyebrow="Calibration" title="Compare self-rating with AI evaluation" description="Use the gap to understand whether your delivery felt stronger or weaker than the scored signal.">
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(SELF_RATING_META).map(([metric, meta]) => (
                      <div key={metric} className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-bold leading-6 text-[var(--text-primary)]">{meta.label}</p>
                          <span className="text-sm font-semibold" style={{ color: meta.accent }}>Self {selfRating[metric]}/10</span>
                        </div>
                        <input type="range" min="1" max="10" value={selfRating[metric]} onChange={(e) => setSelfRating((prev) => ({ ...prev, [metric]: Number(e.target.value) }))} className="w-full" />
                        <div className="mt-3 flex items-center justify-between text-sm text-[var(--text-secondary)]">
                          <span>AI {Number(aiScores[metric] ?? 0).toFixed(1)}/10</span>
                          <span>{gapLabel(selfRating[metric] - (aiScores[metric] ?? 0))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {ratingGaps.map((item) => (
                      <div key={item.metric} className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{SELF_RATING_META[item.metric].label}</p>
                        <p className="mt-2 text-base font-bold" style={{ color: SELF_RATING_META[item.metric].accent }}>{item.label}</p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">Gap: {item.gap > 0 ? "+" : ""}{item.gap} points</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
