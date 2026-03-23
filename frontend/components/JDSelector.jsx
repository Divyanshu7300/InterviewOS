"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function JDSelector({ onSelect, selectedId = null, placeholder = "Select a Job Description" }) {
  const { user } = useAuth();
  const [jdList, setJdList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const userId = user?.id ? parseInt(user.id) : null;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    console.log("Fetching URL:", `/jd/list`, "params:", { user_id: userId });
    console.log("Axios baseURL:", api.defaults.baseURL);


    api.get(`/jd/list`, { params: { user_id: userId } })
    .then(r => {
      console.log("Response:", r.data);
      setJdList(r.data || []);
      setError(null);
    })
    .catch(err => {
      console.log("Error status:", err.response?.status);
      console.log("Error data:", err.response?.data);
      console.log("Full error:", err.message);
      setError(err.response?.data?.detail || "Failed to load job descriptions");
      setJdList([]);
    })
    .finally(() => setLoading(false));
}, [userId]);
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 20);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [jdList]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollLeft + (direction === "left" ? -320 : 320),
        behavior: "smooth",
      });
    }
  };
  console.log(user);


  /* ── STATE: ERROR ── */
  if (error) {
    
    return (
        
      <div className="rounded-2xl p-4 text-center"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
          Error: {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-semibold hover:opacity-80 transition-opacity"
          style={{ color: "var(--accent-blue)" }}>
          Retry →
        </button>
      </div>
    );
  }

  /* ── STATE: LOADING ── */
  if (loading) {
    return (
      <div className="rounded-2xl p-4 text-center"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--accent-blue)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading job descriptions...
          </p>
        </div>
      </div>
    );
  }

  /* ── STATE: EMPTY ── */
  if (jdList.length === 0) {
    return (
      <div className="rounded-2xl p-6 text-center"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
          No job descriptions found
        </p>
        <Link href="/dashboard/jd"
          className="text-xs font-semibold no-underline hover:opacity-80 transition-opacity inline-block"
          style={{ color: "var(--accent-blue)" }}>
          Analyze a JD →
        </Link>
      </div>
    );
  }

  /* ── MAIN ── */
  return (
    <div className="relative w-full">

      {/* ── LEFT ARROW ── */}
      {showLeftArrow && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* ── RIGHT ARROW ── */}
      {showRightArrow && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {/* ── SCROLL CONTAINER ── */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "var(--accent-blue) var(--border)" }}
      >
        <style jsx>{`
          div::-webkit-scrollbar { height: 4px; }
          div::-webkit-scrollbar-track { background: var(--border); border-radius: 10px; }
          div::-webkit-scrollbar-thumb { background: var(--accent-blue); border-radius: 10px; }
        `}</style>

        {jdList.map((jd, idx) => {
          const isSelected = jd.jd_id === selectedId;
          return (
            <motion.div
              key={jd.jd_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSelect(jd.jd_id)}
              className="flex-shrink-0 w-80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
              style={{
                background: isSelected
                  ? "linear-gradient(135deg, rgba(124,106,247,0.12), rgba(124,106,247,0.04))"
                  : "var(--bg-card)",
                border: isSelected
                  ? "1.5px solid var(--accent-blue)"
                  : "1px solid var(--border)",
              }}
            >
              {/* Card Header */}
              <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-1 rounded-lg"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                      #{jd.jd_id}
                    </span>
                    {jd.seniority_level && (
                      <span className="text-[10px] px-2 py-1 rounded-lg font-medium"
                        style={{ background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.2)", color: "var(--accent-blue)" }}>
                        {jd.seniority_level}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-semibold" style={{ color: "var(--accent-blue)" }}>
                      ✓ Selected
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                  {jd.role_title || "Unknown Role"}
                </h3>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {jd.experience_required && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{jd.experience_required}</span>
                  </div>
                )}

                {jd.tech_stack?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {jd.tech_stack.slice(0, 5).map(tech => (
                      <span key={tech} className="text-[10px] px-2 py-1 rounded-lg font-mono"
                        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                        {tech}
                      </span>
                    ))}
                    {jd.tech_stack.length > 5 && (
                      <span className="text-[10px] px-2 py-1 rounded-lg font-mono"
                        style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                        +{jd.tech_stack.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              {!isSelected && (
                <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <span className="text-[11px] font-medium" style={{ color: "var(--accent-blue)" }}>
                    Click to select →
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}