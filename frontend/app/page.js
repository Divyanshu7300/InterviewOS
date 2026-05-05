"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  { label: "JD Analysis", title: "Decode the role", desc: "Extract the skills, stack, and interview topics that matter.", tone: "text-sky-300", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.24)" },
  { label: "Resume Match", title: "Tune your fit", desc: "Find missing keywords and weak resume signals fast.", tone: "text-rose-300", bg: "rgba(244, 63, 94, 0.12)", border: "rgba(244, 63, 94, 0.24)" },
  { label: "AI Interview", title: "Practice the room", desc: "Run focused mocks with scoring and feedback.", tone: "text-emerald-300", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.22)" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay },
});

function FeatureCard({ feature, index }) {
  return (
    <div
      className="group relative overflow-hidden rounded-[24px] border p-5 transition-all duration-200 hover:-translate-y-1"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at top right, ${feature.bg}, transparent 38%)` }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-[var(--border)] bg-[var(--bg-card)] text-[11px] font-bold text-[var(--text-primary)]">
          0{index + 1}
        </span>
        <span
          className={`rounded-[14px] border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] ${feature.tone}`}
          style={{ background: feature.bg, borderColor: feature.border }}
        >
          {feature.label}
        </span>
      </div>
      <h3 className="relative mt-5 text-lg font-bold text-[var(--text-primary)]">{feature.title}</h3>
      <p className="relative mt-2 text-sm leading-6 text-[var(--text-secondary)]">{feature.desc}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-28 pt-4 sm:px-5">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <motion.section
          {...fadeUp(0)}
          className="theme-hero relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-8 shadow-[0_28px_90px_rgba(3,7,18,0.34)] sm:px-8 sm:py-10"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "var(--hero-surface)",
            }}
          />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200/80">
                AI Powered
              </p>
              <h1 className="mt-3 max-w-3xl text-[40px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[58px]">
                Your interview prep workspace.
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-7 text-slate-200/80 sm:text-[16px]">
                One clean place for JD analysis, resume fit, mock interviews, and learning.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-[20px] px-5 text-sm font-bold text-slate-950 no-underline"
                  style={{ background: "var(--brand-gradient)", boxShadow: "0 18px 50px rgba(125, 211, 252, 0.2)" }}
                >
                  Get Started
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-[20px] border border-white/10 bg-white/6 px-5 text-sm font-bold text-white no-underline"
                >
                  Sign up free
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">Start Here</p>
              <div className="mt-5 grid gap-3">
                {[
                  ["1", "Analyze JD"],
                  ["2", "Check resume"],
                  ["3", "Practice mock"],
                ].map(([step, label]) => (
                  <div key={step} className="flex items-center gap-3 rounded-2xl bg-white/6 px-4 py-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-white/10 text-xs font-black text-white">
                      {step}
                    </span>
                    <p className="text-sm font-semibold text-white">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          {...fadeUp(0.1)}
          className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[0_24px_80px_rgba(3,7,18,0.24)] sm:p-7"
        >
          <div className="absolute inset-0 opacity-80" style={{ background: "var(--panel-glow)" }} />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Prep Workflow</p>
            <h2 className="mt-2 text-[26px] font-black tracking-[-0.03em] text-[var(--text-primary)]">
              A simpler prep loop
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {features.map((feature, index) => <FeatureCard key={feature.label} feature={feature} index={index} />)}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
