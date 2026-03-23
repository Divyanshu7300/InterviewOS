"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../../components/ProtectedRoute";

const LABELS = ["A", "B", "C", "D"];

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("quizResult");
    if (raw) setResult(JSON.parse(raw));
  }, []);

  if (!result) return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto text-center py-20 text-white/30 text-sm">
        Koi result nahi mila.{" "}
        <button onClick={() => router.push("/dashboard/learn")} className="text-white/50 underline">
          Wapas jao
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
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div>
          <p className="text-xs text-white/30 mb-1">{result.skill_name} · {result.topic_title}</p>
          <h1 className="text-3xl font-bold">
            {passed ? "🎉 Pass!" : "😅 Try Again"}
          </h1>
        </div>

        {/* Score + stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Score",     value: `${pct}%`,              highlight: passed },
            { label: "Correct",   value: `${result.correct}/${result.total}` },
            { label: "XP Earned", value: `+${result.xp_earned}`, highlight: true },
            { label: "Streak",    value: `${result.streak} 🔥` },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="bg-[#111114] border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/30 mb-2">{label}</p>
              <p className={`text-2xl font-bold ${highlight ? "text-white" : "text-white/70"}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Score bar */}
        <div className="bg-[#111114] border border-white/10 rounded-xl p-5">
          <div className="flex justify-between text-xs text-white/30 mb-2">
            <span>Score</span>
            <span className={passed ? "text-green-400" : "text-red-400"}>{pct}% · {passed ? "PASSED" : "FAILED"}</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${passed ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-white/20 mt-2">Pass ke liye 70% chahiye</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => router.push("/dashboard/learn")}
            className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-all"
          >
            More Topics →
          </button>
          <button
            onClick={() => setShowReview(!showReview)}
            className="px-5 py-2.5 rounded-lg text-sm border border-white/10 text-white/50 hover:border-white/20 hover:text-white/70 transition-all"
          >
            {showReview ? "Hide Review" : "Review Answers"}
          </button>
          <button
            onClick={() => router.push("/dashboard/learn/stats")}
            className="px-5 py-2.5 rounded-lg text-sm border border-white/10 text-white/50 hover:border-white/20 hover:text-white/70 transition-all"
          >
            My Stats
          </button>
        </div>

        {/* Answer Review */}
        {showReview && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-white/60">Answer Review</h2>
            {(result.results || []).map((r, idx) => {
              const q       = qMap[r.question_id];
              const userIdx = result.answers?.[r.question_id];
              if (!q) return null;
              return (
                <div
                  key={r.question_id}
                  className={`bg-[#111114] border rounded-xl p-5 flex flex-col gap-4 ${
                    r.correct ? "border-green-500/20" : "border-red-500/20"
                  }`}
                >
                  <div>
                    <p className="text-xs text-white/30 mb-1">
                      Q{idx + 1} · {r.correct ? "✓ Correct" : "✗ Wrong"}
                    </p>
                    <p className="text-sm font-medium text-white leading-relaxed">
                      {q.question_text}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {q.options.map((opt, oi) => {
                      const isCorrect = oi === r.correct_index;
                      const isUser    = oi === userIdx;
                      return (
                        <div
                          key={oi}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs border ${
                            isCorrect
                              ? "bg-green-500/10 border-green-500/30 text-green-400"
                              : isUser && !isCorrect
                              ? "bg-red-500/10 border-red-500/30 text-red-400"
                              : "border-white/5 text-white/25"
                          }`}
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
                    <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                      <p className="text-xs text-white/30 mb-1">Explanation</p>
                      <p className="text-xs text-white/60 leading-relaxed">{r.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}