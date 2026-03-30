"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../../components/ProtectedRoute";

const LABELS = ["A", "B", "C", "D"];

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
      <div className="mx-auto max-w-3xl py-20 text-center text-base text-[var(--text-primary)]">
        No result found.{" "}
        <button onClick={() => router.push("/dashboard/learn")} className="font-medium underline text-[var(--text-primary)]">
          Go back
        </button>
      </div>
    </ProtectedRoute>
  );

  const pct    = Math.round(result.score);
  const passed = result.passed;
  const qMap   = {};
  (result.questions || []).forEach(q => { qMap[q.id] = q; });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-24 pt-[80px] sm:px-5">
        <div className="mx-auto flex max-w-4xl flex-col gap-7">

          {/* Header */}
          <div className="pt-2">
            <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">
              {result.skill_name} · {result.topic_title}
            </p>
            <h1 className="text-[36px] font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {passed ? "Pass!" : "Try Again"}
            </h1>
          </div>

          {/* Score + stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Score",     value: `${pct}%`,              accent: passed ? "#22c55e" : "#ef4444" },
              { label: "Correct",   value: `${result.correct}/${result.total}` },
              { label: "XP Earned", value: `+${result.xp_earned}`, accent: "var(--text-primary)" },
              { label: "Streak",    value: `${result.streak} 🔥` },
            ].map(({ label, value, accent }) => (
              <div key={label} className="rounded-2xl border p-5"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">{label}</p>
                <p className="text-[28px] font-bold tracking-tight" style={{ color: accent || "var(--text-primary)" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Score bar */}
          <div className="rounded-2xl border p-6"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="mb-2 flex justify-between text-sm font-medium text-[var(--text-primary)]">
              <span>Score</span>
              <span style={{ color: passed ? "#22c55e" : "#ef4444" }}>
                {pct}% · {passed ? "PASSED" : "FAILED"}
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: passed ? "#22c55e" : "#ef4444" }}
              />
            </div>
            <p className="mt-2 text-sm text-[var(--text-primary)]">70% is required to pass</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/dashboard/learn")}
              className="rounded-xl px-5 py-3 text-sm font-semibold transition-all"
              style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}
            >
              More Topics →
            </button>
            <button
              onClick={() => setShowReview(!showReview)}
              className="rounded-xl border px-5 py-3 text-sm font-semibold transition-all"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-card)" }}
            >
              {showReview ? "Hide Review" : "Review Answers"}
            </button>
            <button
              onClick={() => router.push("/dashboard/learn/stats")}
              className="rounded-xl border px-5 py-3 text-sm font-semibold transition-all"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-card)" }}
            >
              My Stats
            </button>
          </div>

          {/* Answer Review */}
          {showReview && (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Answer Review</h2>
              {(result.results || []).map((r, idx) => {
                const q       = qMap[r.question_id];
                const userIdx = result.answers?.[r.question_id];
                if (!q) return null;
                return (
                  <div
                    key={r.question_id}
                    className="flex flex-col gap-5 rounded-2xl border p-5 sm:p-6"
                    style={{
                      background: "var(--bg-card)",
                      borderColor: r.correct ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                    }}
                  >
                    <div>
                      <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">
                        Q{idx + 1} · {r.correct ? "✓ Correct" : "✗ Wrong"}
                      </p>
                      <p className="text-base font-medium leading-7" style={{ color: "var(--text-primary)" }}>
                        {q.question_text}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {q.options.map((opt, oi) => {
                        const isCorrect = oi === r.correct_index;
                        const isUser    = oi === userIdx;
                        return (
                          <div
                            key={oi}
                            className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm"
                            style={{
                              background: isCorrect
                                ? "rgba(34,197,94,0.1)"
                                : isUser && !isCorrect
                                  ? "rgba(239,68,68,0.1)"
                                  : "var(--bg-secondary)",
                              borderColor: isCorrect
                                ? "rgba(34,197,94,0.3)"
                                : isUser && !isCorrect
                                  ? "rgba(239,68,68,0.3)"
                                  : "var(--border)",
                              color: isCorrect
                                ? "#22c55e"
                                : isUser && !isCorrect
                                  ? "#ef4444"
                                  : "var(--text-primary)",
                            }}
                          >
                            <span className="font-bold shrink-0">{LABELS[oi]}</span>
                            <span>{opt}</span>
                            {isCorrect && <span className="ml-auto">✓</span>}
                            {isUser && !isCorrect && <span className="ml-auto">✗</span>}
                          </div>
                        );
                      })}
                    </div>

                    {r.explanation && (
                      <div className="rounded-xl border px-4 py-4"
                        style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                        <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">Explanation</p>
                        <p className="text-sm leading-relaxed text-[var(--text-primary)]">{r.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
