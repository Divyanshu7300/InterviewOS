"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import UserAvatar from "@/components/UserAvatar";

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
  resume:    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6M9 9h2",
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
  { href: "/dashboard/resume",    label: "Resume",    icon: "resume",    exact: false },
  { href: "/dashboard/interview", label: "Interview", icon: "interview", exact: false },
  { href: "/dashboard/learn",     label: "Learn",     icon: "learn",     exact: false },
  { href: "/dashboard/community", label: "Community", icon: "community", exact: false },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all duration-150 hover:scale-[1.03]"
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <Icon d={isDark ? icons.sun : icons.moon} size={14} />
    </button>
  );
}

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  if (loading || !user || (!pathname.startsWith("/dashboard") && !pathname.startsWith("/home"))) return null;

  const displayName = user.username
    ? `@${user.username}`
    : user.email?.split("@")[0] ?? "";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 h-[60px] border-b border-[var(--border)] bg-[var(--bg-primary)] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-5">

        <Link href="/dashboard"
          className="shrink-0 text-base font-semibold tracking-tight text-[var(--text-primary)] no-underline">
          interview<span className="opacity-40">OS</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map(link => {
            const active = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-150 no-underline ${
                  active ? "bg-[var(--bg-card)] border border-[var(--border)]" : "bg-transparent border border-transparent"
                }`}
              >
                <Icon d={icons[link.icon]} size={13} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">

          <ThemeToggle />

          <Link
            href="/dashboard/profile"
            className={`flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-[var(--text-primary)] transition-all duration-150 no-underline ${
              pathname.startsWith("/dashboard/profile") ? "bg-[var(--bg-card)]" : "bg-[var(--bg-card)]"
            }`}
          >
            <UserAvatar name={displayName} size="sm" />
            <span className="hidden max-w-[120px] truncate text-sm font-medium md:block">{displayName}</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-150 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-500"
          >
            <Icon d={icons.logout} size={13} />
            <span className="hidden sm:inline">Out</span>
          </button>
        </div>

      </div>
    </nav>
  );
}
