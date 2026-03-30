"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

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
        setJdList(r.data || []);
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
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] px-5 py-6 text-center sm:px-6">
        <p className="mb-2 text-base font-semibold text-[var(--text-primary)]">
          Error: {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-semibold text-[var(--text-primary)] transition-opacity hover:opacity-80">
          Retry
        </button>
      </div>
    );
  }

  /* ── STATE: LOADING ── */
  if (loading) {
    return (
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] px-5 py-8 text-center sm:px-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--text-primary)] border-t-transparent" />
          <p className="text-base font-medium text-[var(--text-primary)]">
            Loading job descriptions...
          </p>
        </div>
      </div>
    );
  }

  /* ── STATE: EMPTY ── */
  if (jdList.length === 0) {
    return (
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-8 text-center">
        <p className="mb-2 text-base font-semibold text-[var(--text-primary)]">
          {placeholder}
        </p>
        <p className="mb-4 text-sm text-[var(--text-primary)]">
          Add a job description first and it will show up here automatically.
        </p>
        <Link href="/dashboard/jd"
          className="inline-block text-sm font-semibold text-[var(--text-primary)] no-underline transition-opacity hover:opacity-80">
          Analyze a JD
        </Link>
      </div>
    );
  }

  /* ── MAIN ── */
  return (
    <div className="rounded-[32px] border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-primary)]">
          Job Description
        </p>
        <h3 className="text-xl font-bold leading-tight text-[var(--text-primary)] sm:text-2xl">
          {title}
        </h3>
        <p className="text-sm leading-6 text-[var(--text-primary)] sm:text-[15px]">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {jdList.map((jd, idx) => {
          const isSelected = jd.jd_id === selectedId;
          return (
            <motion.button
              key={jd.jd_id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSelect(jd.jd_id, jd)}
              className="group rounded-[26px] border p-4 text-left transition-all duration-200 sm:p-5"
              style={{
                background: isSelected ? "var(--text-primary)" : "var(--bg-primary)",
                borderColor: isSelected ? "var(--text-primary)" : "var(--border)",
                color: isSelected ? "var(--bg-primary)" : "var(--text-primary)",
                boxShadow: isSelected ? "0 18px 42px rgba(0,0,0,0.14)" : "none",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full border px-3 py-1.5 text-sm font-semibold"
                    style={{
                      borderColor: isSelected ? "rgba(255,255,255,0.24)" : "var(--border)",
                      background: isSelected ? "rgba(255,255,255,0.08)" : "var(--bg-card)",
                      color: isSelected ? "var(--bg-primary)" : "var(--text-primary)",
                    }}
                  >
                    JD #{jd.jd_id}
                  </span>
                  {jd.seniority_level && (
                    <span
                      className="rounded-full border px-3 py-1.5 text-sm font-semibold"
                      style={{
                        borderColor: isSelected ? "rgba(255,255,255,0.24)" : "var(--border)",
                        background: isSelected ? "rgba(255,255,255,0.08)" : "var(--bg-card)",
                        color: isSelected ? "var(--bg-primary)" : "var(--text-primary)",
                      }}
                    >
                      {jd.seniority_level}
                    </span>
                  )}
                </div>
                <span
                  className="rounded-full border px-3 py-1.5 text-sm font-semibold"
                  style={{
                    borderColor: isSelected ? "rgba(255,255,255,0.24)" : "var(--border)",
                    background: isSelected ? "rgba(255,255,255,0.08)" : "var(--bg-card)",
                    color: isSelected ? "var(--bg-primary)" : "var(--text-primary)",
                  }}
                >
                  {isSelected ? "Selected" : "Select"}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-lg font-bold leading-snug sm:text-xl">
                    {jd.role_title || "Unknown Role"}
                  </h4>
                  {jd.experience_required && (
                    <p className="mt-2 text-sm font-medium sm:text-[15px]">
                      {jd.experience_required}
                    </p>
                  )}
                </div>

                {jd.tech_stack?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {jd.tech_stack.slice(0, 6).map(tech => (
                      <span
                        key={tech}
                        className="rounded-full border px-3 py-1.5 text-sm font-semibold"
                        style={{
                          borderColor: isSelected ? "rgba(255,255,255,0.24)" : "var(--border)",
                          background: isSelected ? "rgba(255,255,255,0.08)" : "var(--bg-card)",
                          color: isSelected ? "var(--bg-primary)" : "var(--text-primary)",
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                    {jd.tech_stack.length > 6 && (
                      <span className="rounded-full border px-3 py-1.5 text-sm font-semibold"
                        style={{
                          borderColor: isSelected ? "rgba(255,255,255,0.24)" : "var(--border)",
                          background: isSelected ? "rgba(255,255,255,0.08)" : "var(--bg-card)",
                          color: isSelected ? "var(--bg-primary)" : "var(--text-primary)",
                        }}>
                        +{jd.tech_stack.length - 6} more
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
