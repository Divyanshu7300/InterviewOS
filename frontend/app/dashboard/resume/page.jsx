"use client";

import { useState } from "react";
import api from "../../../lib/axios";
import { useAuth } from "../../../context/AuthContext";
import JDSelector from "../../../components/JDSelector";

function ScoreBar({ label, value, max = 100 }) {
  const pct   = Math.round((value / max) * 100);
  const color = pct >= 70 ? "#4ade80" : pct >= 40 ? "#facc15" : "#f87171";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-base font-medium text-[var(--text-primary)]">{label}</span>
        <span className="text-base font-mono font-semibold" style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }}
        />
      </div>
    </div>
  );
}

function Tag({ label, color }) {
  const styles = {
    green:  { bg: "bg-green-500/10",  border: "border-green-500/20",  text: "text-green-400" },
    red:    { bg: "bg-red-500/10",    border: "border-red-500/20",    text: "text-red-400" },
    yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
  };
  const s = styles[color] || styles.green;
  return (
    <span className={`rounded-full border px-3 py-1.5 text-sm font-medium ${s.bg} ${s.border} ${s.text}`}>
      {label}
    </span>
  );
}

export default function ResumeAnalyzer() {
  const { user } = useAuth();

  const [jdId,     setJdId]     = useState(null);
  const [file,     setFile]     = useState(null);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadResume = async () => {
    if (!file)     return setError("Please select a PDF file.");
    if (!jdId)     return setError("Please select a Job Description.");
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
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
    else setError("Only PDF files allowed.");
  };

  const reset = () => {
    setResult(null);
    setFile(null);
    setError(null);
    setJdId(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-24 pt-[80px] sm:px-5">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:gap-10 sm:px-1">

      {/* Header */}
      <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-primary)]">
            Resume Analysis
          </p>
          <h1 className="mt-2 text-[32px] font-extrabold leading-[1.04] tracking-tight text-[var(--text-primary)] sm:text-[42px]">
            Resume Analyzer
          </h1>
          <p className="mt-3 text-base leading-7 text-[var(--text-primary)] sm:text-[17px]">
            Upload your resume to compare with a job description.
          </p>
        </div>
        {result && (
          <button
            onClick={reset}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-all"
          >
            ← New Analysis
          </button>
        )}
      </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            ⚠ {error}
          </div>
        )}

        {/* Input section */}
        {!result && (
          <div className="flex flex-col gap-8 rounded-[32px] border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-7">

          {/* Step 1 */}
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
              Step 1
            </p>
            <h2 className="mb-4 text-[28px] font-bold tracking-tight text-[var(--text-primary)] sm:text-[30px]">
              Select a Job Description
            </h2>
            <JDSelector
              selectedId={jdId}
              onSelect={setJdId}
              placeholder="Choose a JD to compare against."
              title="Match your resume against the exact role"
              description="Use the same role card here and in Interview Setup so your resume review and practice interview stay in sync."
            />
          </div>

          {/* Step 2 */}
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
              Step 2
            </p>
            <h2 className="mb-4 text-[28px] font-bold tracking-tight text-[var(--text-primary)] sm:text-[30px]">
              Upload Your Resume
            </h2>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("resume-input").click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[26px] border px-4 py-12 transition-all sm:px-6"
              style={{
                borderColor: dragOver
                  ? "var(--text-primary)"
                  : file
                  ? "var(--text-primary)"
                  : "var(--border)",
                background: dragOver
                  ? "var(--bg-primary)"
                  : file
                  ? "var(--bg-primary)"
                  : "var(--bg-secondary)",
              }}
            >
              <input
                id="resume-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => { const f = e.target.files[0]; if (f) setFile(f); }}
              />
              <div className="text-4xl">{file ? "✅" : "📄"}</div>
              {file ? (
                <div className="text-center">
                  <p className="text-lg font-semibold text-[var(--text-primary)]">
                    {file.name}
                  </p>
                  <p className="mt-1 text-base text-[var(--text-primary)]">
                    {(file.size / 1024).toFixed(0)} KB · Click to change
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-medium text-[var(--text-primary)]">
                    Drop PDF here or click to browse
                  </p>
                  <p className="mt-1 text-base text-[var(--text-primary)]">
                    PDF only · Max 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Analyze button */}
          <button
            onClick={uploadResume}
            disabled={loading || !file || !jdId}
            className="flex w-full items-center justify-center gap-2 rounded-[24px] py-4 text-lg font-bold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: "var(--text-primary)",
              color: "var(--bg-primary)",
            }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 rounded-full animate-spin inline-block"
                  style={{ borderColor: "var(--border)", borderTopColor: "var(--bg-primary)" }} />
                Analyzing...
              </>
            ) : (
              "Analyze Resume →"
            )}
          </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="flex flex-col gap-5">

          {/* Score Overview */}
          <div className="flex flex-col gap-5 rounded-2xl border p-6 sm:p-7"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
              Score Overview
            </p>
            <div className="flex flex-col gap-4">
              <ScoreBar label="ATS Score"       value={result.analysis.ats_score}       max={100} />
              <ScoreBar label="Role Match"       value={result.analysis.role_match}       max={100} />
              <ScoreBar label="Experience Match" value={result.analysis.experience_match} max={100} />
            </div>
          </div>

          {/* Skills grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* Matched */}
            <div className="rounded-2xl border p-5 sm:p-6"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                ✓ Matched Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {result.analysis.matched_skills?.length > 0
                  ? result.analysis.matched_skills.map(s => <Tag key={s} label={s} color="green" />)
                  : <p className="text-base text-[var(--text-primary)]">None found</p>
                }
              </div>
            </div>

            {/* Missing */}
            <div className="rounded-2xl border p-5 sm:p-6"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                ✗ Missing Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {result.analysis.missing_skills?.length > 0
                  ? result.analysis.missing_skills.map(s => <Tag key={s} label={s} color="red" />)
                  : <p className="text-base text-[var(--text-primary)]">None - great.</p>
                }
              </div>
            </div>

            {/* Weak */}
            <div className="rounded-2xl border p-5 sm:p-6"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                ⚠ Weak Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {result.analysis.weak_skills?.length > 0
                  ? result.analysis.weak_skills.map(s => <Tag key={s} label={s} color="yellow" />)
                  : <p className="text-base text-[var(--text-primary)]">None</p>
                }
              </div>
            </div>

            {/* Detected Skills */}
            {result.skills && Object.keys(result.skills).length > 0 && (
              <div className="rounded-2xl border p-5 sm:p-6"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                  📋 Detected Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.skills)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 12)
                    .map(([skill, score]) => (
                      <span key={skill}
                        className="rounded-full border px-3 py-1.5 text-sm font-medium"
                        style={{
                          background: "var(--bg-secondary)",
                          borderColor: "var(--border)",
                          color: "var(--text-primary)",
                        }}>
                        {skill} · {score}
                      </span>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {result.analysis.improvement_suggestions?.length > 0 && (
            <div className="rounded-2xl border p-6 sm:p-7"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                💡 Improvement Suggestions
              </p>
              <ul className="flex flex-col gap-3">
                {result.analysis.improvement_suggestions.map((s, i) => (
                  <li key={i} className="flex gap-3 text-base leading-7"
                    style={{ color: "var(--text-primary)" }}>
                    <span className="font-mono shrink-0 mt-0.5" style={{ opacity: 0.4 }}>
                      {String(i + 1).padStart(2, "0")}.
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          </div>
        )}
      </div>
    </div>
  );
}
