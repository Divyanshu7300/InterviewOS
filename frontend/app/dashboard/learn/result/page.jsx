"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { motion } from "framer-motion";

const LABELS = ["A", "B", "C", "D"];
const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 16, filter: "blur(4px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay } });

function Metric({ label, value, good }) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border p-5" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className={`mt-5 text-[30px] font-black leading-none ${good === true ? "text-emerald-300" : good === false ? "text-rose-300" : "text-[var(--text-primary)]"}`}>{value}</p>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result] = useState(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("quizResult");
    return raw ? JSON.parse(raw) : null;
  });
  const [showReview, setShowReview] = useState(false);

  if (!result) return (
    <ProtectedRoute>
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4 text-center">
        <div className="rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-8">
          <p className="text-base text-[var(--text-primary)]">No result found.</p>
          <button onClick={() => router.push("/dashboard/learn")} className="mt-4 rounded-[18px] px-5 py-3 text-sm font-bold text-white" style={{ background: "var(--brand-gradient)" }}>Go back</button>
        </div>
      </div>
    </ProtectedRoute>
  );

  const pct = Math.round(result.score);
  const passed = result.passed;
  const qMap = {};
  (result.questions || []).forEach((q) => { qMap[q.id] = q; });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-28 pt-[84px] sm:px-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <motion.section {...fadeUp(0)} className="theme-hero relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-7 shadow-[0_28px_90px_rgba(3,7,18,0.34)] sm:px-8 sm:py-9">
            <div className="absolute inset-0" style={{ background: "var(--hero-surface)" }} />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_280px] lg:items-end">
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200/80">{result.skill_name} · {result.topic_title}</p><h1 className="mt-3 text-[40px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[58px]">{passed ? "Quiz passed." : "Try this one again."}</h1><p className="mt-4 text-sm leading-7 text-slate-200/80">70 percent is required to pass. Review answers to close the gaps.</p></div>
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Score</p><p className={`mt-2 text-5xl font-black ${passed ? "text-emerald-300" : "text-rose-300"}`}>{pct}%</p><div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full" style={{ background: passed ? "#34d399" : "#fb7185" }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} /></div></div>
            </div>
          </motion.section>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Score" value={`${pct}%`} good={passed} />
            <Metric label="Correct" value={`${result.correct}/${result.total}`} />
            <Metric label="XP Earned" value={`+${result.xp_earned}`} good />
            <Metric label="Streak" value={result.streak} />
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[0_24px_80px_rgba(3,7,18,0.24)] sm:p-7">
            <div className="absolute inset-0 opacity-80" style={{ background: "var(--panel-glow)" }} />
            <div className="relative">
              <div className="mb-3 flex justify-between text-sm font-bold text-[var(--text-primary)]"><span>Pass requirement</span><span className={passed ? "text-emerald-300" : "text-rose-300"}>{pct}% · {passed ? "PASSED" : "FAILED"}</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--border)]"><motion.div className="h-full rounded-full" style={{ width: `${pct}%`, background: passed ? "#34d399" : "#fb7185" }} /></div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={() => router.push("/dashboard/learn")} className="rounded-[18px] px-5 py-3 text-sm font-bold text-white" style={{ background: "var(--brand-gradient)" }}>More Topics</button>
                <button onClick={() => setShowReview(!showReview)} className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-3 text-sm font-bold text-[var(--text-primary)]">{showReview ? "Hide Review" : "Review Answers"}</button>
                <button onClick={() => router.push("/dashboard/learn/stats")} className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-3 text-sm font-bold text-[var(--text-primary)]">My Stats</button>
              </div>
            </div>
          </div>

          {showReview ? (
            <div className="flex flex-col gap-4">
              {(result.results || []).map((r, idx) => {
                const q = qMap[r.question_id];
                const userIdx = result.answers?.[r.question_id];
                if (!q) return null;
                return (
                  <div key={r.question_id} className="rounded-[24px] border p-5" style={{ background: "var(--bg-card)", borderColor: r.correct ? "rgba(16,185,129,0.22)" : "rgba(244,63,94,0.24)" }}>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${r.correct ? "text-emerald-300" : "text-rose-300"}`}>Q{idx + 1} · {r.correct ? "Correct" : "Wrong"}</p>
                    <p className="mt-3 text-base font-bold leading-7 text-[var(--text-primary)]">{q.question_text}</p>
                    <div className="mt-5 flex flex-col gap-2">
                      {q.options.map((opt, oi) => {
                        const isCorrect = oi === r.correct_index;
                        const isUser = oi === userIdx;
                        return (
                          <div key={oi} className={`flex items-center gap-3 rounded-[18px] border px-4 py-3 text-sm ${isCorrect ? "text-emerald-300" : isUser && !isCorrect ? "text-rose-300" : "text-[var(--text-primary)]"}`} style={{ background: isCorrect ? "rgba(16,185,129,0.12)" : isUser && !isCorrect ? "rgba(244,63,94,0.12)" : "var(--bg-secondary)", borderColor: isCorrect ? "rgba(16,185,129,0.22)" : isUser && !isCorrect ? "rgba(244,63,94,0.24)" : "var(--border)" }}>
                            <span className="font-black">{LABELS[oi]}</span><span>{opt}</span>{isCorrect ? <span className="ml-auto">OK</span> : null}{isUser && !isCorrect ? <span className="ml-auto">Your pick</span> : null}
                          </div>
                        );
                      })}
                    </div>
                    {r.explanation ? <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-4"><p className="text-sm font-bold text-[var(--text-primary)]">Explanation</p><p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{r.explanation}</p></div> : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}
