"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  logout:    "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  home:      "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  jd:        "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  interview: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  learn:     "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  community: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",
  sun:       "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  moon:      "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
};

const navLinks = [
  { href: "/home",                label: "Home",      icon: "home",      exact: true  },
  { href: "/dashboard",           label: "Dashboard", icon: "dashboard", exact: true  },
  { href: "/dashboard/jd",        label: "JD",        icon: "jd",        exact: false },
  { href: "/dashboard/interview", label: "Interview", icon: "interview", exact: false },
  { href: "/dashboard/learn",     label: "Learn",     icon: "learn",     exact: false },
  { href: "/dashboard/community", label: "Community", icon: "community", exact: false },
];

const COLORS = [
  "bg-blue-500/20 text-blue-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-amber-500/20 text-amber-300",
  "bg-rose-500/20 text-rose-300",
  "bg-purple-500/20 text-purple-300",
];

function Avatar({ name }) {
  const str      = name ?? "?";
  const initials = str.replace("@", "").slice(0, 2).toUpperCase();
  const color    = COLORS[str.charCodeAt(0) % COLORS.length];
  return (
    <div className={`w-7 h-7 ${color} rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-150 text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--text-muted)]"
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <Icon d={isDark ? icons.sun : icons.moon} size={13} />
    </button>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  if (!user || (!pathname.startsWith("/dashboard") && !pathname.startsWith("/home"))) return null;

  const displayName = user.username
    ? `@${user.username}`
    : user.email?.split("@")[0] ?? "";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b"
      style={{ background: "var(--bg-primary)", borderColor: "var(--border)", height: "52px" }}>
      <div className="max-w-5xl mx-auto px-5 h-full flex items-center justify-between gap-6">

        <Link href="/dashboard"
          className="text-[13px] font-semibold tracking-tight no-underline flex-shrink-0"
          style={{ color: "var(--text-muted)" }}>
          interview<span style={{ opacity: 0.4 }}>OS</span>
        </Link>

        <div className="flex items-center gap-0.5">
          {navLinks.map(link => {
            const active = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 no-underline"
                style={{
                  background: active ? "var(--border)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                }}>
                <Icon d={icons[link.icon]} size={12} />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">

          <ThemeToggle />

          <Link href="/dashboard/profile"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-150 no-underline"
            style={{
              background: pathname.startsWith("/dashboard/profile") ? "var(--border)" : "var(--bg-card)",
              borderColor: "var(--border)",
              color: "var(--text-muted)",
            }}>
            <Avatar name={displayName} />
            <span className="text-[12px] hidden md:block truncate max-w-[110px]">{displayName}</span>
          </Link>

          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] border border-transparent hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all duration-150"
            style={{ color: "var(--text-muted)" }}>
            <Icon d={icons.logout} size={12} />
            <span className="hidden sm:inline">Out</span>
          </button>
        </div>

      </div>
    </nav>
  );
}