"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { motion } from "framer-motion";

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const features = [
  {
    step:  "01",
    icon:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    label: "JD Analysis",
    title: "Decode any Job Description in seconds",
    desc:  "Paste a JD and get an instant breakdown — tech stack, required skills, seniority level, key responsibilities, and resume keywords. Know exactly what the role demands before you apply.",
    bullets: ["Tech stack extraction", "Seniority & experience level", "Resume keyword suggestions", "Interview topic predictions"],
    href:  "/dashboard/jd",
    cta:   "Analyze a JD →",
    color: "text-blue-400",
    bg:    "bg-blue-500/10 border-blue-500/20",
  },
  {
    step:  "02",
    icon:  "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6M9 9h2",
    label: "Resume Analysis",
    title: "See how your resume matches the role",
    desc:  "Upload your resume against a selected job description and get ATS fit, skill match, missing keywords, and weak areas before you apply.",
    bullets: ["ATS score breakdown", "Matched vs missing skills", "Role-fit scoring", "Gap-aware resume feedback"],
    href:  "/dashboard/resume",
    cta:   "Analyze Your Resume ->",
    color: "text-rose-400",
    bg:    "bg-rose-500/10 border-rose-500/20",
  },
  {
    step:  "03",
    icon:  "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    label: "AI Interview",
    title: "Practice interviews tailored to your role",
    desc:  "Get AI-generated questions specific to the job and level. Answer them, then get scored on correctness, depth, and clarity — with detailed feedback on every response.",
    bullets: ["Role-specific questions", "Real-time AI scoring", "Correctness + depth + clarity", "Detailed answer feedback"],
    href:  "/dashboard/interview",
    cta:   "Start an Interview →",
    color: "text-purple-400",
    bg:    "bg-purple-500/10 border-purple-500/20",
  },
  {
    step:  "04",
    icon:  "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    label: "Skill Learning",
    title: "Build skills with quizzes, XP & streaks",
    desc:  "Topic-wise quizzes across beginner, intermediate, and advanced levels. Earn XP for every quiz you pass, maintain daily streaks, and climb the leaderboard.",
    bullets: ["Beginner to advanced topics", "XP rewards per quiz", "Daily streak tracking", "Global leaderboard"],
    href:  "/dashboard/learn",
    cta:   "Start Learning →",
    color: "text-emerald-400",
    bg:    "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    step:  "05",
    icon:  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",
    label: "Community",
    title: "Learn faster together",
    desc:  "Discuss prep strategies, share interview experiences, ask questions, and get answers from others on the same journey. Real conversations, not just resources.",
    bullets: ["Threaded discussions", "Upvotes & replies", "Shared experiences", "Peer support"],
    href:  "/dashboard/community",
    cta:   "Join the Community →",
    color: "text-amber-400",
    bg:    "bg-amber-500/10 border-amber-500/20",
  },
];

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 20, filter: "blur(4px)" },
  animate:    { opacity: 1, y: 0,  filter: "blur(0px)" },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay },
});

export default function HomePage() {
  const { user } = useAuth() ?? {};

  const displayName = user?.username
    ? `@${user.username}`
    : user?.email?.split("@")[0] ?? "there";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-32 pt-[80px] sm:px-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-20">

          {/* ── HERO ── */}
          <motion.div {...fadeUp(0)} className="flex flex-col gap-5 pt-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-primary)]">
              Welcome, {displayName}
            </p>
            <h1 className="text-[38px] font-extrabold leading-[1.02] tracking-tight text-[var(--text-primary)] sm:text-[52px]">
              Land your<br />next role.
            </h1>
            <p className="max-w-2xl text-[17px] leading-8 text-[var(--text-primary)]">
              InterviewOS is your end-to-end interview prep platform — from
              decoding JDs and analyzing resumes to practicing with AI, building skills, and connecting
              with a community of job seekers.
            </p>
            <div className="flex items-center gap-3 mt-1">
              <Link href="/dashboard/jd"
                className="rounded-xl bg-[var(--text-primary)] px-5 py-2.5 text-sm font-bold text-[var(--bg-primary)] transition-all no-underline">
                Get Started →
              </Link>
              <Link href="/dashboard"
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-all no-underline">
                View Dashboard
              </Link>
            </div>
          </motion.div>

          {/* ── FEATURES ── */}
          <div className="flex flex-col gap-5">
            <motion.div {...fadeUp(0.1)}>
              <p className="mb-1 text-[10px] uppercase tracking-widest text-[var(--text-primary)]">
                Features
              </p>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Everything you need to get hired
              </h2>
            </motion.div>

            <div className="flex flex-col gap-5">
              {features.map((f, i) => (
                <motion.div
                  key={f.step}
                  {...fadeUp(0.15 + i * 0.08)}
                  className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] transition-all duration-200"
                >
                  {/* card top */}
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
                          <span className="text-[10px] font-bold text-[var(--text-primary)]">
                            {f.step}
                          </span>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${f.bg} ${f.color}`}>
                          {f.label}
                        </span>
                      </div>
                      <div className={`${f.color} opacity-40 group-hover:opacity-70 transition-opacity`}>
                        <Icon d={f.icon} size={16} />
                      </div>
                    </div>

                    <h3 className="text-[18px] font-bold leading-snug text-[var(--text-primary)]">
                      {f.title}
                    </h3>

                    <p className="text-[15px] leading-7 text-[var(--text-primary)]">
                      {f.desc}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {f.bullets.map(b => (
                        <div key={b} className="flex items-center gap-2">
                          <span className={`text-[10px] ${f.color}`}>✓</span>
                          <span className="text-[13px] text-[var(--text-primary)]">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* card footer */}
                  <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-3.5">
                    <Link href={f.href}
                      className={`text-[13px] font-semibold ${f.color} hover:opacity-80 transition-opacity no-underline`}>
                      {f.cta}
                    </Link>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" className="text-[var(--text-primary)]">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
