"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6"
      style={{ background: "var(--bg-primary)" }}>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl"
      >
        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase mb-4"
          style={{ color: "var(--text-muted)" }}>
          AI Powered
        </p>

        <h1 className="text-5xl font-bold mb-6"
          style={{ color: "var(--text-primary)" }}>
          Your Interview<br />Prep Platform
        </h1>

        <p className="mb-8 text-lg"
          style={{ color: "var(--text-muted)" }}>
          Practice interviews. Analyze resumes. Improve faster.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.push("/login")}
            className="px-8 py-3 rounded-xl font-semibold hover:scale-[1.02] transition-all duration-150"
            style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
            Get Started →
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="px-8 py-3 rounded-xl font-medium hover:scale-[1.02] transition-all duration-150 border"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-card)" }}>
            Sign up free
          </button>
        </div>
      </motion.div>

    </div>
  );
}