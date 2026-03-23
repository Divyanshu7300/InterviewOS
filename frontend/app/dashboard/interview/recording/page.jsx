"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ProtectedRoute from "../../../../components/ProtectedRoute";

const checklist = [
  "Eye contact with camera",
  "Clear and confident voice",
  "No excessive filler words (um, uh)",
  "Good posture and body language",
  "Structured answers (STAR method)",
  "Technical accuracy of answers",
  "Response time — not too fast or slow",
  "Professional appearance",
];

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16, filter: "blur(4px)" },
  animate:    { opacity: 1, y: 0,  filter: "blur(0px)" },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay },
});

export default function InterviewRecordingPage() {
  const router = useRouter();
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [session,     setSession]     = useState(null);
  const [checked,     setChecked]     = useState([]);

  useEffect(() => {
    const url = sessionStorage.getItem("recordingUrl");
    const raw = sessionStorage.getItem("interviewSession");
    if (url) setRecordedUrl(url);
    if (raw) setSession(JSON.parse(raw));
  }, []);

  const toggleCheck = (item) =>
    setChecked(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  const downloadRecording = () => {
    if (!recordedUrl) return;
    const a = document.createElement("a");
    a.href     = recordedUrl;
    a.download = `interview-${session?.sessionId || "session"}.webm`;
    a.click();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>

        {/* ── TOP BAR ── */}
        <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${recordedUrl ? "bg-emerald-400" : ""}`}
              style={!recordedUrl ? { background: "var(--text-muted)", opacity: 0.4 } : {}} />
            <span className="text-[15px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {session?.roleTitle ? `Recording — ${session.roleTitle}` : "Interview Recording"}
            </span>
          </div>
          <button
            onClick={() => router.push("/dashboard/interview")}
            className="text-xs font-semibold px-4 py-2 rounded-lg border transition-opacity hover:opacity-80"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            ← Back
          </button>
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 max-w-3xl mx-auto w-full px-5 pb-20">

          {!recordedUrl ? (
            /* ── EMPTY STATE ── */
            <motion.div {...fadeUp(0)}
              className="flex flex-col items-center justify-center text-center pt-24 gap-4">
              <p className="text-4xl">📹</p>
              <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                No recording found
              </h2>
              <p className="text-sm font-light" style={{ color: "var(--text-muted)" }}>
                Record your next interview session to review it here.
              </p>
              <button
                onClick={() => router.push("/dashboard/interview")}
                className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
                Start an Interview →
              </button>
            </motion.div>

          ) : (
            <>
              {/* ── HERO ── */}
              <motion.div {...fadeUp(0)} className="pt-10 flex flex-col gap-2 mb-8">
                <p className="text-[11px] font-semibold tracking-[0.22em] uppercase"
                  style={{ color: "var(--text-muted)" }}>
                  Review
                </p>
                <h1 className="text-[36px] font-extrabold tracking-tight leading-[1.08]"
                  style={{ color: "var(--text-primary)" }}>
                  Your Recording
                </h1>
                <p className="text-[15px] font-light leading-relaxed"
                  style={{ color: "var(--text-muted)" }}>
                  Watch your session back, download it, and use the checklist below to self-evaluate.
                </p>
              </motion.div>

              {/* ── VIDEO PLAYER ── */}
              <motion.div {...fadeUp(0.08)}
                className="rounded-2xl overflow-hidden border mb-4"
                style={{ background: "#000", borderColor: "var(--border)" }}>
                <video src={recordedUrl} controls className="w-full block" style={{ maxHeight: 520 }} />
              </motion.div>

              {/* ── DOWNLOAD ── */}
              <motion.div {...fadeUp(0.12)} className="mb-8">
                <button
                  onClick={downloadRecording}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold border transition-opacity hover:opacity-80"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                  ↓ Download Recording
                </button>
              </motion.div>

              {/* ── SELF EVALUATION CHECKLIST ── */}
              <motion.div {...fadeUp(0.16)}
                className="rounded-2xl p-6 border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>

                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-1"
                      style={{ color: "var(--text-muted)" }}>
                      Checklist
                    </p>
                    <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                      Self Evaluation
                    </h2>
                  </div>
                  <span className="text-[12px] font-semibold px-3 py-1 rounded-full border"
                    style={{
                      background: checked.length === checklist.length ? "rgba(52,211,153,0.1)" : "var(--bg-secondary)",
                      borderColor: checked.length === checklist.length ? "rgba(52,211,153,0.2)" : "var(--border)",
                      color: checked.length === checklist.length ? "#34d399" : "var(--text-muted)",
                    }}>
                    {checked.length}/{checklist.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {checklist.map(item => {
                    const done = checked.includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggleCheck(item)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                        style={{
                          background: done ? "rgba(52,211,153,0.06)" : "var(--bg-secondary)",
                          borderColor: done ? "rgba(52,211,153,0.2)" : "var(--border)",
                        }}>
                        <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all"
                          style={{
                            background: done ? "#34d399" : "transparent",
                            borderColor: done ? "#34d399" : "var(--border)",
                          }}>
                          {done && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className="text-[13px] font-light leading-snug"
                          style={{ color: done ? "#34d399" : "var(--text-muted)" }}>
                          {item}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {checked.length === checklist.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-5 rounded-xl px-4 py-3 text-sm font-light text-center border"
                    style={{ background: "rgba(52,211,153,0.06)", borderColor: "rgba(52,211,153,0.2)", color: "#34d399" }}>
                    ✓ All items checked — great session!
                  </motion.div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}