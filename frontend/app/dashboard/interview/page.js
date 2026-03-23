"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../../lib/axios";
import { useAuth } from "../../../context/AuthContext";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { motion } from "framer-motion";

const LEVELS = ["EASY", "MEDIUM", "HARD"];
const LEVEL_COLOR = {
  EASY:   { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  MEDIUM: { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  HARD:   { text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20" },
};

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16, filter: "blur(4px)" },
  animate:    { opacity: 1, y: 0,  filter: "blur(0px)" },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay },
});

export default function InterviewSetupPage() {
  const router   = useRouter();
  const { user } = useAuth();

  const [jdId,      setJdId]      = useState(null);
  const [level,     setLevel]     = useState("MEDIUM");
  const [jdList,    setJdList]    = useState([]);
  const [jdLoading, setJdLoading] = useState(true);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const userId = user?.id ? parseInt(user.id) : null;

  useEffect(() => {
    // Auth still loading — wait
    if (user === undefined) return;

    // User not logged in
    if (!userId) {
      setJdLoading(false);
      return;
    }

    setJdLoading(true);
    setError(null);

    api.get(`/jd/list`, { params: { user_id: userId } })
      .then(r  => setJdList(r.data || []))
      .catch(e => setError(e.response?.data?.detail || "Failed to load job descriptions."))
      .finally(() => setJdLoading(false));
  }, [userId, user]);

  const startInterview = async () => {
    if (!jdId)   return setError("Please select a Job Description.");
    if (!userId) return setError("User not found. Please login again.");
    setLoading(true); setError(null);
    try {
      const res = await api.post("/interview/start", {
        jd_id:   jdId,
        level,
        user_id: userId,
      });
      sessionStorage.setItem("interviewSession", JSON.stringify({
        sessionId:     res.data.session_id,
        roleTitle:     res.data.role_title,
        level:         res.data.level,
        firstQuestion: res.data.question,
        jdId,
        userId,
      }));
      router.push("/dashboard/interview/session");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail))                     setError(detail.map(d => d.msg || JSON.stringify(d)).join(", "));
      else if (detail && typeof detail === "object")  setError(JSON.stringify(detail));
      else                                            setError(detail || "Could not start interview.");
    } finally {
      setLoading(false);
    }
  };

  const selectedJD = jdList.find(j => j.jd_id === jdId);

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-32" style={{ paddingTop: "72px", background: "var(--bg-primary)" }}>
        <div className="max-w-2xl mx-auto px-5 flex flex-col gap-10">

          {/* ── HERO ── */}
          <motion.div {...fadeUp(0)} className="pt-12 flex flex-col gap-3">
            <p className="text-[11px] font-semibold tracking-[0.22em] uppercase"
              style={{ color: "var(--text-muted)" }}>
              Interview Setup
            </p>
            <h1 className="text-[38px] font-extrabold tracking-tight leading-[1.08]"
              style={{ color: "var(--text-primary)" }}>
              Ready to practice?
            </h1>
            <p className="text-[15px] font-light leading-relaxed"
              style={{ color: "var(--text-muted)" }}>
              Pick a job description and difficulty. The AI will ask role-specific
              questions and score your answers in real time.
            </p>
          </motion.div>

          {/* ── ERROR ── */}
          {error && (
            <motion.div {...fadeUp(0)}
              className="flex items-center gap-2 text-[13px] px-4 py-3 rounded-xl border"
              style={{ background: "rgba(244,63,94,0.08)", color: "#fb7185", borderColor: "rgba(244,63,94,0.18)" }}>
              ⚠ {error}
            </motion.div>
          )}

          {/* ── STEP 1 — JD ── */}
          <motion.div {...fadeUp(0.1)} className="flex flex-col gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-1"
                style={{ color: "var(--text-muted)" }}>
                Step 1
              </p>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                Select a Job Description
              </h2>
            </div>

            {/* Auth/JD loading skeletons */}
            {(user === undefined || jdLoading) && (
              <div className="flex flex-col gap-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-24 rounded-2xl border animate-pulse"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border)" }} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {user !== undefined && !jdLoading && jdList.length === 0 && (
              <div className="rounded-2xl p-8 text-center border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <p className="text-3xl mb-3">📄</p>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  No JDs found
                </p>
                <p className="text-xs font-light mb-4" style={{ color: "var(--text-muted)" }}>
                  Analyze a job description first to use it here.
                </p>
                <Link href="/dashboard/jd"
                  className="text-xs font-bold px-4 py-2 rounded-xl no-underline transition-opacity hover:opacity-80 inline-block"
                  style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
                  Analyze a JD →
                </Link>
              </div>
            )}

            {/* JD List */}
            {user !== undefined && !jdLoading && jdList.length > 0 && (
              <div className="flex flex-col gap-3">
                {jdList.map((jd, idx) => {
                  const isSelected = jdId === jd.jd_id;
                  return (
                    <motion.div
                      key={jd.jd_id}
                      {...fadeUp(0.05 * idx)}
                      onClick={() => setJdId(jd.jd_id)}
                      className="rounded-2xl overflow-hidden cursor-pointer border transition-all duration-200"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: isSelected ? "var(--text-primary)" : "var(--border)",
                        borderWidth: isSelected ? "1.5px" : "1px",
                      }}
                    >
                      {/* Card body */}
                      <div className="p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-lg border"
                              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                              #{jd.jd_id}
                            </span>
                            {jd.seniority_level && (
                              <span className="text-[10px] font-semibold px-2 py-1 rounded-lg border"
                                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                                {jd.seniority_level}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <span className="text-[11px] font-bold" style={{ color: "var(--text-primary)" }}>
                              ✓ Selected
                            </span>
                          )}
                        </div>

                        <h3 className="text-[16px] font-bold leading-snug"
                          style={{ color: "var(--text-primary)" }}>
                          {jd.role_title || "Unknown Role"}
                        </h3>

                        {jd.experience_required && (
                          <div className="flex items-center gap-1.5">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2"
                              style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <span className="text-xs font-light" style={{ color: "var(--text-muted)" }}>
                              {jd.experience_required}
                            </span>
                          </div>
                        )}

                        {jd.tech_stack?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {jd.tech_stack.slice(0, 6).map(tech => (
                              <span key={tech} className="text-[10px] px-2 py-1 rounded-lg border"
                                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                                {tech}
                              </span>
                            ))}
                            {jd.tech_stack.length > 6 && (
                              <span className="text-[10px] px-2 py-1 rounded-lg"
                                style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                                +{jd.tech_stack.length - 6}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card footer */}
                      <div className="px-4 py-3 border-t flex items-center justify-between"
                        style={{ borderColor: "var(--border)" }}>
                        <span className="text-[12px] font-semibold"
                          style={{ color: isSelected ? "var(--text-primary)" : "var(--text-muted)" }}>
                          {isSelected ? "Selected for interview" : "Click to select →"}
                        </span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2"
                          style={{ color: "var(--text-muted)" }}>
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* ── STEP 2 — DIFFICULTY ── */}
          <motion.div {...fadeUp(0.18)} className="flex flex-col gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-1"
                style={{ color: "var(--text-muted)" }}>
                Step 2
              </p>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                Choose Difficulty
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {LEVELS.map(l => {
                const c      = LEVEL_COLOR[l];
                const active = level === l;
                return (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`py-3.5 rounded-xl border text-sm font-bold tracking-wide transition-all duration-200 ${
                      active ? `${c.bg} ${c.border} ${c.text}` : ""
                    }`}
                    style={!active ? {
                      background: "var(--bg-card)",
                      borderColor: "var(--border)",
                      color: "var(--text-muted)",
                    } : {}}>
                    {l}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* ── START ── */}
          <motion.div {...fadeUp(0.24)}>
            <button
              onClick={startInterview}
              disabled={loading || !jdId}
              className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 rounded-full animate-spin inline-block"
                    style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "var(--bg-primary)" }} />
                  Starting…
                </>
              ) : jdId ? (
                `Start Interview — ${selectedJD?.role_title || "Selected JD"} →`
              ) : (
                "Select a JD to continue"
              )}
            </button>
          </motion.div>

        </div>
      </div>
    </ProtectedRoute>
  );
}