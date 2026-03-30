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
  }, [topicId, user?.id]);

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
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-24 pt-[80px] sm:px-5">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">

          {/* ── HEADER ── */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => router.back()}
              className="text-sm font-medium text-[var(--text-primary)] transition-colors">
              ← Back
            </button>
            {quizData && (
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {quizData.skill_name} · {quizData.topic_title}
              </span>
            )}
          </div>

          {/* ── PROGRESS BAR ── */}
          <div className="flex items-center gap-4 rounded-2xl border p-5"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full"
              style={{ background: "var(--border)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--text-primary)" }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
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
            <div className="flex flex-col items-center gap-4 rounded-2xl border p-12"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <Spinner />
              <p className="text-lg font-medium text-[var(--text-primary)]">
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
                className="flex flex-col gap-7 rounded-[28px] border p-6 sm:p-7"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                {/* Q number + text */}
                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                    Question {current + 1} of {total}
                  </p>
                  <h2 className="text-[24px] font-semibold leading-9 tracking-tight"
                    style={{ color: "var(--text-primary)" }}>
                    {q.question_text}
                  </h2>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-3.5">
                  {q.options.map((opt, idx) => {
                    const isSelected  = answers[q.id] === idx;
                    const isAnswered  = answers[q.id] !== undefined;
                    return (
                      <button
                        key={idx}
                        onClick={() => pick(idx)}
                        className="flex items-start gap-3 rounded-2xl border p-4 text-left text-base transition-all duration-150"
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
                              ? "var(--text-primary)"
                              : "var(--text-primary)",
                          cursor:       isAnswered && !isSelected ? "default" : "pointer",
                          opacity:      isAnswered && !isSelected ? 0.5 : 1,
                        }}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition-all"
                          style={{
                            background:  isSelected ? "var(--bg-primary)" : "var(--bg-card)",
                            borderColor: isSelected ? "var(--bg-primary)" : "var(--border)",
                            color:       "var(--text-primary)",
                          }}>
                          {LABELS[idx]}
                        </span>
                        <span className="pt-0.5 leading-7">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Nav */}
                <div className="flex items-center justify-between border-t pt-4"
                  style={{ borderColor: "var(--border)" }}>
                  <div className="flex gap-2">
                    {current > 0 && (
                      <button onClick={() => setCurrent(c => c - 1)}
                        className="rounded-xl border px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all"
                        style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                        ← Prev
                      </button>
                    )}
                    {current < total - 1 && (
                      <button onClick={() => setCurrent(c => c + 1)}
                        className="rounded-xl border px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all"
                        style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                        Next →
                      </button>
                    )}
                  </div>

                  <button
                    onClick={submit}
                    disabled={submitting || answered === 0}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      background: answered === total ? "var(--text-primary)" : "var(--bg-secondary)",
                      color:      answered === total ? "var(--bg-primary)"   : "var(--text-primary)",
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
            <div className="rounded-2xl border p-5"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                Jump to question
              </p>
              <div className="flex flex-wrap gap-2.5">
                {questions.map((q2, i) => (
                  <button
                    key={q2.id}
                    onClick={() => setCurrent(i)}
                    className="h-9 w-9 rounded-xl border text-sm font-semibold transition-all"
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
                          : "var(--text-primary)",
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
