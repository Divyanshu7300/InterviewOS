"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "../../../../../lib/axios";
import { useAuth } from "../../../../../context/AuthContext";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import { motion, AnimatePresence } from "framer-motion";

const LABELS = ["A", "B", "C", "D"];
const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 16, filter: "blur(4px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay } });

const Spinner = () => <span className="inline-block h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: "rgba(15,23,42,0.22)", borderTopColor: "rgb(15,23,42)" }} />;

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const topicId = params?.topicId;

  const [quizData, setQuizData] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!topicId) return;
    const uid = user?.id ? parseInt(user.id) : null;
    api.post(`/learn/topics/${topicId}/questions`, null, { params: { count: 15, ...(uid && { user_id: uid }) } })
      .then((r) => setQuizData(r.data))
      .catch((err) => {
        const d = err.response?.data?.detail;
        setError(typeof d === "string" ? d : "Failed to load questions.");
      })
      .finally(() => setLoading(false));
  }, [topicId, user?.id]);

  const questions = quizData?.questions ?? [];
  const q = questions[current];
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const pct = total ? Math.round((answered / total) * 100) : 0;

  const pick = (idx) => {
    if (!q || answers[q.id] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
    setTimeout(() => { if (current < total - 1) setCurrent((c) => c + 1); }, 400);
  };

  const submit = async () => {
    if (!user?.id) { setError("Please log in."); return; }
    setSubmitting(true);
    try {
      const payload = {
        user_id: parseInt(user.id),
        topic_id: parseInt(topicId),
        answers: Object.entries(answers).map(([qid, idx]) => ({ question_id: parseInt(qid), selected_index: idx })),
      };
      const res = await api.post("/learn/quiz/submit", payload);
      sessionStorage.setItem("quizResult", JSON.stringify({ ...res.data, topic_title: quizData.topic_title, skill_name: quizData.skill_name, questions, answers }));
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
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-28 pt-[84px] sm:px-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <motion.section {...fadeUp(0)} className="theme-hero relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-7 shadow-[0_28px_90px_rgba(3,7,18,0.34)] sm:px-8 sm:py-9">
            <div className="absolute inset-0" style={{ background: "var(--hero-surface)" }} />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div><button onClick={() => router.back()} className="mb-4 rounded-[16px] border border-white/10 bg-white/6 px-4 py-2 text-sm font-bold text-white">Back</button><p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200/80">Quiz</p><h1 className="mt-3 text-[34px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[48px]">{quizData ? quizData.topic_title : "Generating quiz"}</h1><p className="mt-4 text-sm leading-7 text-slate-200/80">{quizData ? quizData.skill_name : "AI is preparing your questions."}</p></div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 backdrop-blur"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Answered</p><p className="mt-1 text-2xl font-black text-white">{answered}/{total}</p><div className="mt-4 h-3 w-48 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full" style={{ background: "var(--brand-gradient-strong)" }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} /></div></div>
            </div>
          </motion.section>

          <AnimatePresence>{error ? <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</motion.div> : null}</AnimatePresence>

          {loading ? (
            <div className="flex flex-col items-center gap-4 rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-12 shadow-[0_24px_80px_rgba(3,7,18,0.24)]"><Spinner /><p className="text-lg font-bold text-[var(--text-primary)]">Generating questions with AI...</p></div>
          ) : null}

          <AnimatePresence mode="wait">
            {!loading && q ? (
              <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[0_24px_80px_rgba(3,7,18,0.24)] sm:p-7">
                <div className="absolute inset-0 opacity-80" style={{ background: "var(--panel-glow)" }} />
                <div className="relative">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Question {current + 1} of {total}</p>
                  <h2 className="mt-3 text-[24px] font-black leading-9 tracking-[-0.03em] text-[var(--text-primary)]">{q.question_text}</h2>
                  <div className="mt-7 flex flex-col gap-3">
                    {q.options.map((opt, idx) => {
                      const isSelected = answers[q.id] === idx;
                      const isAnswered = answers[q.id] !== undefined;
                      return (
                        <button key={idx} onClick={() => pick(idx)} className="flex items-start gap-3 rounded-[22px] border p-4 text-left transition-all hover:-translate-y-0.5" style={{ background: isSelected ? "var(--selected-bg)" : "var(--bg-secondary)", borderColor: isSelected ? "var(--selected-border)" : "var(--border)", boxShadow: isSelected ? "0 16px 44px var(--selected-ring)" : "none", opacity: isAnswered && !isSelected ? 0.55 : 1 }}>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] border text-sm font-black" style={{ background: isSelected ? "var(--brand-gradient)" : "var(--bg-card)", borderColor: isSelected ? "var(--selected-border)" : "var(--border)", color: isSelected ? "#fff" : "var(--text-primary)" }}>{LABELS[idx]}</span>
                          <span className="pt-1 text-sm leading-7 text-[var(--text-primary)]">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-2">{current > 0 ? <button onClick={() => setCurrent((c) => c - 1)} className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-bold text-[var(--text-primary)]">Prev</button> : null}{current < total - 1 ? <button onClick={() => setCurrent((c) => c + 1)} className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-bold text-[var(--text-primary)]">Next</button> : null}</div>
                    <button onClick={submit} disabled={submitting || answered === 0} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[18px] px-5 text-sm font-bold text-white disabled:opacity-40" style={{ background: "var(--brand-gradient)" }}>{submitting ? <><Spinner /> Submitting...</> : answered === total ? "Submit" : `Submit (${answered}/${total})`}</button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {!loading && questions.length > 0 ? (
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Jump to question</p>
              <div className="flex flex-wrap gap-2">{questions.map((q2, i) => <button key={q2.id} onClick={() => setCurrent(i)} className="h-10 w-10 rounded-[14px] border text-sm font-black" style={{ background: current === i ? "var(--brand-gradient)" : answers[q2.id] !== undefined ? "var(--selected-bg)" : "var(--bg-card)", borderColor: current === i || answers[q2.id] !== undefined ? "var(--selected-border)" : "var(--border)", boxShadow: current === i ? "0 10px 28px var(--selected-ring)" : "none", color: current === i ? "#fff" : "var(--text-primary)" }}>{i + 1}</button>)}</div>
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}
