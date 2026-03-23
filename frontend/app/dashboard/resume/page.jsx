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
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="text-xs font-mono font-semibold" style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
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
    <span className={`text-xs px-2.5 py-1 rounded-full border ${s.bg} ${s.border} ${s.text}`}>
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
    <div className="max-w-3xl mx-auto flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight"
            style={{ color: "var(--text-primary)" }}>
            Resume Analyzer
          </h1>
          <p className="text-sm font-light mt-1" style={{ color: "var(--text-muted)" }}>
            Upload your resume to compare with a job description.
          </p>
        </div>
        {result && (
          <button
            onClick={reset}
            className="text-xs px-3 py-1.5 rounded-lg border transition-all"
            style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--bg-card)" }}
          >
            ← New Analysis
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm border flex items-center gap-2"
          style={{ background: "rgba(244,63,94,0.08)", color: "#fb7185", borderColor: "rgba(244,63,94,0.18)" }}>
          ⚠ {error}
        </div>
      )}

      {/* Input section */}
      {!result && (
        <div className="rounded-2xl p-6 flex flex-col gap-6 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>

          {/* Step 1 */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-3"
              style={{ color: "var(--text-muted)" }}>
              Step 1 — Select Job Description
            </p>
            <JDSelector
              selectedId={jdId}
              onSelect={setJdId}
              placeholder="Choose a JD to compare against..."
            />
          </div>

          {/* Step 2 */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-3"
              style={{ color: "var(--text-muted)" }}>
              Step 2 — Upload Resume (PDF)
            </p>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("resume-input").click()}
              className="rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-3 py-10"
              style={{
                borderColor: dragOver
                  ? "rgba(124,106,247,0.5)"
                  : file
                  ? "rgba(74,222,128,0.3)"
                  : "var(--border)",
                background: dragOver
                  ? "rgba(124,106,247,0.04)"
                  : file
                  ? "rgba(74,222,128,0.04)"
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
              <div className="text-3xl">{file ? "✅" : "📄"}</div>
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {file.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {(file.size / 1024).toFixed(0)} KB · Click to change
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Drop PDF here or click to browse
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
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
            className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <div className="rounded-2xl p-6 flex flex-col gap-5 border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold"
              style={{ color: "var(--text-muted)" }}>
              Score Overview
            </p>
            <div className="flex flex-col gap-4">
              <ScoreBar label="ATS Score"       value={result.analysis.ats_score}       max={100} />
              <ScoreBar label="Role Match"       value={result.analysis.role_match}       max={100} />
              <ScoreBar label="Experience Match" value={result.analysis.experience_match} max={100} />
            </div>
          </div>

          {/* Skills grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Matched */}
            <div className="rounded-2xl p-5 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-4"
                style={{ color: "var(--text-muted)" }}>
                ✓ Matched Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {result.analysis.matched_skills?.length > 0
                  ? result.analysis.matched_skills.map(s => <Tag key={s} label={s} color="green" />)
                  : <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.4 }}>None found</p>
                }
              </div>
            </div>

            {/* Missing */}
            <div className="rounded-2xl p-5 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-4"
                style={{ color: "var(--text-muted)" }}>
                ✗ Missing Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {result.analysis.missing_skills?.length > 0
                  ? result.analysis.missing_skills.map(s => <Tag key={s} label={s} color="red" />)
                  : <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.4 }}>None — great!</p>
                }
              </div>
            </div>

            {/* Weak */}
            <div className="rounded-2xl p-5 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-4"
                style={{ color: "var(--text-muted)" }}>
                ⚠ Weak Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {result.analysis.weak_skills?.length > 0
                  ? result.analysis.weak_skills.map(s => <Tag key={s} label={s} color="yellow" />)
                  : <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.4 }}>None</p>
                }
              </div>
            </div>

            {/* Detected Skills */}
            {result.skills && Object.keys(result.skills).length > 0 && (
              <div className="rounded-2xl p-5 border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-4"
                  style={{ color: "var(--text-muted)" }}>
                  📋 Detected Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.skills)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 12)
                    .map(([skill, score]) => (
                      <span key={skill}
                        className="text-xs px-2.5 py-1 rounded-full border font-mono"
                        style={{
                          background: "var(--bg-secondary)",
                          borderColor: "var(--border)",
                          color: "var(--text-muted)",
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
            <div className="rounded-2xl p-6 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-4"
                style={{ color: "var(--text-muted)" }}>
                💡 Improvement Suggestions
              </p>
              <ul className="flex flex-col gap-3">
                {result.analysis.improvement_suggestions.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed"
                    style={{ color: "var(--text-muted)" }}>
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
  );
}