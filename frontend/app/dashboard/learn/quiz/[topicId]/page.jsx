"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "../../../../../lib/axios";
import { useAuth } from "../../../../../context/AuthContext";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import { motion, AnimatePresence } from "framer-motion";

const LABELS = ["A", "B", "C", "D"];

const Spinner = () => (
  <span className="w-4 h-4 border-2 rounded-full animate-spin inline-block"
    style={{ borderColor: "var(--border)", borderTopColor: "var(--text-primary)" }} />
);

export default function QuizPage() {
  const router   = useRouter();
  const params   = useParams();
  const { user } = useAuth();
  const topicId  = params?.topicId;

  const [quizData,    setQuizData]    = useState(null);
  const [current,     setCurrent]     = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    if (!topicId) return;
    const uid = user?.id ? parseInt(user.id) : null;
    api.post(
      `/learn/topics/${topicId}/questions`,
      null,
      { params: { count: 15, ...(uid && { user_id: uid }) } }
    )
      .then(r => setQuizData(r.data))
      .catch(err => {
        const d = err.response?.data?.detail;
        setError(typeof d === "string" ? d : "Failed to load questions.");
      })
      .finally(() => setLoading(false));
  }, [topicId]);

  const questions = quizData?.questions ?? [];
  const q         = questions[current];
  const total     = questions.length;
  const answered  = Object.keys(answers).length;
  const pct       = total ? Math.round((answered / total) * 100) : 0;

  const pick = (idx) => {
    if (!q || answers[q.id] !== undefined) return;
    setAnswers(prev => ({ ...prev, [q.id]: idx }));
    setTimeout(() => {
      if (current < total - 1) setCurrent(c => c + 1);
    }, 400);
  };

  const submit = async () => {
    if (!user?.id) { setError("Please log in."); return; }
    setSubmitting(true);
    try {
      const payload = {
        user_id:  parseInt(user.id),
        topic_id: parseInt(topicId),
        answers:  Object.entries(answers).map(([qid, idx]) => ({
          question_id:    parseInt(qid),
          selected_index: idx,
        })),
      };
      const res = await api.post("/learn/quiz/submit", payload);
      sessionStorage.setItem("quizResult", JSON.stringify({
        ...res.data,
        topic_title: quizData.topic_title,
        skill_name:  quizData.skill_name,
        questions,
        answers,
      }));
      router.push("/dashboard/learn/result");
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-24 px-5"
        style={{ paddingTop: "72px", background: "var(--bg-primary)" }}>
        <div className="max-w-3xl mx-auto flex flex-col gap-5">

          {/* ── HEADER ── */}
          <div className="pt-6 flex items-center justify-between">
            <button onClick={() => router.back()}
              className="text-[12px] font-medium transition-colors"
              style={{ color: "var(--text-muted)" }}>
              ← Back
            </button>
            {quizData && (
              <span className="text-[12px] font-medium"
                style={{ color: "var(--text-muted)" }}>
                {quizData.skill_name} · {quizData.topic_title}
              </span>
            )}
          </div>

          {/* ── PROGRESS BAR ── */}
          <div className="rounded-2xl p-4 flex items-center gap-4 border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: "var(--border)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--text-primary)" }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="text-[12px] font-semibold shrink-0"
              style={{ color: "var(--text-muted)" }}>
              {answered}/{total}
            </span>
          </div>

          {/* ── ERROR ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-rose-400 text-sm font-medium bg-rose-500/10 border border-rose-500/20">
                ⚠ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── LOADING ── */}
          {loading && (
            <div className="rounded-2xl p-12 flex flex-col items-center gap-4 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <Spinner />
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                Generating questions with AI…
              </p>
            </div>
          )}

          {/* ── QUESTION CARD ── */}
          <AnimatePresence mode="wait">
            {!loading && q && (
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl p-6 flex flex-col gap-6 border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                {/* Q number + text */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-3"
                    style={{ color: "var(--text-muted)" }}>
                    Question {current + 1} of {total}
                  </p>
                  <h2 className="text-base font-semibold leading-relaxed"
                    style={{ color: "var(--text-primary)" }}>
                    {q.question_text}
                  </h2>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-3">
                  {q.options.map((opt, idx) => {
                    const isSelected  = answers[q.id] === idx;
                    const isAnswered  = answers[q.id] !== undefined;
                    return (
                      <button
                        key={idx}
                        onClick={() => pick(idx)}
                        className="flex items-start gap-3 p-4 rounded-xl border text-left text-sm transition-all duration-150"
                        style={{
                          background:   isSelected
                            ? "var(--text-primary)"
                            : isAnswered
                              ? "var(--bg-secondary)"
                              : "var(--bg-secondary)",
                          borderColor:  isSelected
                            ? "var(--text-primary)"
                            : "var(--border)",
                          color:        isSelected
                            ? "var(--bg-primary)"
                            : isAnswered
                              ? "var(--text-muted)"
                              : "var(--text-primary)",
                          cursor:       isAnswered && !isSelected ? "default" : "pointer",
                          opacity:      isAnswered && !isSelected ? 0.5 : 1,
                        }}
                      >
                        <span className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[11px] font-bold border transition-all"
                          style={{
                            background:  isSelected ? "var(--bg-primary)" : "var(--bg-card)",
                            borderColor: isSelected ? "var(--bg-primary)" : "var(--border)",
                            color:       isSelected ? "var(--text-primary)" : "var(--text-muted)",
                          }}>
                          {LABELS[idx]}
                        </span>
                        <span className="leading-relaxed pt-0.5">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Nav */}
                <div className="flex items-center justify-between pt-3 border-t"
                  style={{ borderColor: "var(--border)" }}>
                  <div className="flex gap-2">
                    {current > 0 && (
                      <button onClick={() => setCurrent(c => c - 1)}
                        className="text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-secondary)" }}>
                        ← Prev
                      </button>
                    )}
                    {current < total - 1 && (
                      <button onClick={() => setCurrent(c => c + 1)}
                        className="text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-secondary)" }}>
                        Next →
                      </button>
                    )}
                  </div>

                  <button
                    onClick={submit}
                    disabled={submitting || answered === 0}
                    className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{
                      background: answered === total ? "var(--text-primary)" : "var(--bg-secondary)",
                      color:      answered === total ? "var(--bg-primary)"   : "var(--text-muted)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {submitting
                      ? <><Spinner /> Submitting…</>
                      : answered === total
                        ? "Submit ✓"
                        : `Submit (${answered}/${total})`
                    }
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── QUESTION NAVIGATOR ── */}
          {!loading && questions.length > 0 && (
            <div className="rounded-2xl p-4 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--text-muted)" }}>
                Jump to question
              </p>
              <div className="flex flex-wrap gap-2">
                {questions.map((q2, i) => (
                  <button
                    key={q2.id}
                    onClick={() => setCurrent(i)}
                    className="w-8 h-8 rounded-lg text-[11px] font-semibold transition-all border"
                    style={{
                      background:  current === i
                        ? "var(--text-primary)"
                        : answers[q2.id] !== undefined
                          ? "var(--bg-secondary)"
                          : "var(--bg-secondary)",
                      color:       current === i
                        ? "var(--bg-primary)"
                        : answers[q2.id] !== undefined
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                      borderColor: current === i
                        ? "var(--text-primary)"
                        : answers[q2.id] !== undefined
                          ? "var(--border)"
                          : "var(--border)",
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}