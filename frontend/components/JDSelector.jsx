"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const Icon = ({ d, size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const icons = {
  jd: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  check: "M20 6L9 17l-5-5",
  plus: "M12 5v14M5 12h14",
  refresh: "M21 12a9 9 0 11-2.64-6.36M21 3v6h-6",
};

const tone = {
  sky: { text: "text-sky-300", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.24)" },
  emerald: { text: "text-emerald-300", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.22)" },
  amber: { text: "text-amber-300", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.24)" },
};

function normalizeToArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export default function JDSelector({
  onSelect,
  selectedId = null,
  placeholder = "Select a Job Description",
  title = "Choose the role you want to target",
  description = "Pick a job description to anchor the simulation and keep feedback specific to the role.",
}) {
  const { user } = useAuth();
  const [jdList, setJdList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = user?.id ? parseInt(user.id) : null;

  useEffect(() => {
    if (!userId) {
      return;
    }
    api.get(`/jd/list`, { params: { user_id: userId } })
      .then(r => {
        const normalized = (r.data || []).map((jd) => ({
          ...jd,
          tech_stack: normalizeToArray(jd.tech_stack),
        }));
        setJdList(normalized);
        setError(null);
      })
      .catch(err => {
        setError(err.response?.data?.detail || "Failed to load job descriptions");
        setJdList([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);
  /* ── STATE: ERROR ── */
  if (error) {
    return (
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-8 text-center sm:px-6">
        <div
          className="absolute inset-0 opacity-80"
          style={{ background: "radial-gradient(circle at top right, rgba(244,63,94,0.12), transparent 34%)" }}
        />
        <div className="relative flex flex-col items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-rose-300/25 bg-rose-400/10 text-rose-300">
            <Icon d={icons.refresh} size={17} />
          </span>
          <p className="text-base font-semibold text-[var(--text-primary)]">
          Error: {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-bold text-[var(--text-primary)] transition-opacity hover:opacity-80">
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── STATE: LOADING ── */
  if (loading) {
    return (
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-8 text-center sm:px-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-300/25 border-t-sky-300" />
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            Loading job descriptions...
          </p>
        </div>
      </div>
    );
  }

  /* ── STATE: EMPTY ── */
  if (jdList.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-10 text-center">
        <div
          className="absolute inset-0 opacity-80"
          style={{ background: "radial-gradient(circle at top right, rgba(56,189,248,0.12), transparent 36%)" }}
        />
        <div className="relative flex flex-col items-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-[20px] border text-sky-300"
            style={{ background: tone.sky.bg, borderColor: tone.sky.border }}
          >
            <Icon d={icons.plus} size={22} />
          </span>
          <p className="mt-4 text-base font-bold text-[var(--text-primary)]">{placeholder}</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Add a job description first and it will show up here automatically.
          </p>
          <Link
            href="/dashboard/jd"
            className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-[16px] px-4 text-sm font-bold text-white no-underline"
            style={{ background: "var(--brand-gradient)" }}
          >
            Analyze a JD
          </Link>
        </div>
      </div>
    );
  }

  /* ── MAIN ── */
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-secondary)] p-4 sm:p-5">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(125,211,252,0.1), transparent 32%), radial-gradient(circle at bottom left, rgba(251,191,36,0.08), transparent 30%)",
        }}
      />
      <div className="relative mb-5 flex flex-col gap-2 sm:mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Job Description
        </p>
        <h3 className="text-[24px] font-black leading-tight tracking-[-0.03em] text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-[15px]">
          {description}
        </p>
      </div>

      <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-2">
        {jdList.map((jd, idx) => {
          const isSelected = jd.jd_id === selectedId;
          const techStack = normalizeToArray(jd.tech_stack);
          return (
            <motion.button
              key={jd.jd_id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSelect(jd.jd_id, jd)}
              className={`group relative overflow-hidden rounded-[24px] border p-4 text-left transition-all duration-200 hover:-translate-y-1 sm:p-5 ${
                isSelected ? "translate-y-[-2px]" : ""
              }`}
              style={{
                background: isSelected ? "var(--selected-bg)" : "var(--bg-card)",
                borderColor: isSelected ? "var(--selected-border)" : "var(--border)",
                boxShadow: isSelected ? "0 18px 48px var(--selected-ring)" : "none",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{ background: "radial-gradient(circle at top right, rgba(56,189,248,0.12), transparent 40%)" }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-[14px] border px-3 py-1.5 text-xs font-bold text-sky-300"
                    style={{
                      borderColor: tone.sky.border,
                      background: tone.sky.bg,
                    }}
                  >
                    JD #{jd.jd_id}
                  </span>
                  {jd.seniority_level && (
                    <span
                      className="rounded-[14px] border px-3 py-1.5 text-xs font-bold text-amber-300"
                      style={{
                        borderColor: tone.amber.border,
                        background: tone.amber.bg,
                      }}
                    >
                      {jd.seniority_level}
                    </span>
                  )}
                </div>
                <span
                  className={`flex h-8 min-w-[86px] items-center justify-center gap-1.5 rounded-[14px] border px-3 text-xs font-bold ${
                    isSelected ? "text-rose-300" : "text-[var(--text-primary)]"
                  }`}
                  style={{
                    borderColor: isSelected ? "var(--selected-border)" : "var(--border)",
                    background: isSelected ? "var(--selected-bg)" : "var(--bg-secondary)",
                  }}
                >
                  {isSelected ? <Icon d={icons.check} size={12} /> : null}
                  {isSelected ? "Selected" : "Select"}
                </span>
              </div>

              <div className="relative mt-4 space-y-4">
                <div>
                  <h4 className="text-lg font-black leading-snug tracking-[-0.02em] text-[var(--text-primary)] sm:text-xl">
                    {jd.role_title || "Unknown Role"}
                  </h4>
                  {jd.experience_required && (
                    <p className="mt-2 text-sm font-medium leading-6 text-[var(--text-secondary)] sm:text-[15px]">
                      {jd.experience_required}
                    </p>
                  )}
                </div>

                {techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {techStack.slice(0, 6).map(tech => (
                      <span
                        key={tech}
                        className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
                      >
                        {tech}
                      </span>
                    ))}
                    {techStack.length > 6 && (
                      <span
                        className="rounded-[14px] border px-3 py-1.5 text-xs font-bold text-violet-300"
                        style={{
                          borderColor: "rgba(167,139,250,0.24)",
                          background: "rgba(167,139,250,0.12)",
                        }}
                      >
                        +{techStack.length - 6} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

    </div>
  );
}
