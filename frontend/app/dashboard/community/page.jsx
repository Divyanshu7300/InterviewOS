"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";

const Icon = ({ d, size = 14, filled = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const icons = {
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  reply: "M9 17l-5-5 5-5M20 18v-2a4 4 0 00-4-4H4",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  community: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",
  post: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  spark: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
};

const colors = {
  sky: { text: "text-sky-300", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.24)" },
  emerald: { text: "text-emerald-300", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.22)" },
  amber: { text: "text-amber-300", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.24)" },
  violet: { text: "text-violet-300", bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.24)" },
  rose: { text: "text-rose-300", bg: "rgba(244, 63, 94, 0.12)", border: "rgba(244, 63, 94, 0.24)" },
};

const QUICK_SIGNALS = [
  { label: "Ask", value: "Prep questions" },
  { label: "Share", value: "Interview stories" },
  { label: "Improve", value: "Peer feedback" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1], delay },
});

function timeAgo(d) {
  const seconds = (Date.now() - new Date(d)) / 1000;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function Panel({ eyebrow, title, description, children, aside }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[0_24px_80px_rgba(3,7,18,0.24)] sm:p-7">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "var(--panel-glow)",
        }}
      />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              {eyebrow}
            </p>
            <h2 className="mt-2 text-[26px] font-black tracking-[-0.03em] text-[var(--text-primary)]">
              {title}
            </h2>
            {description ? (
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
                {description}
              </p>
            ) : null}
          </div>
          {children}
        </div>
        {aside ? <div className="relative">{aside}</div> : null}
      </div>
    </div>
  );
}

function ReplyComposer({ onSubmit, onCancel, userName }) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setPosting(true);
    await onSubmit(text);
    setText("");
    setPosting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mt-4 rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)] p-4"
    >
      <div className="flex items-center gap-2">
        <UserAvatar name={userName} size="sm" />
        <span className="text-xs font-semibold text-[var(--text-primary)]">{userName}</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Write a reply..."
        autoFocus
        className="mt-3 w-full resize-none rounded-[18px] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
      />
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-[14px] px-4 py-2 text-xs font-bold text-[var(--text-primary)]"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!text.trim() || posting}
          className="rounded-[14px] px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-40"
          style={{ background: "var(--brand-gradient)" }}
        >
          {posting ? "Posting..." : "Reply"}
        </button>
      </div>
    </motion.div>
  );
}

function Comment({ comment, currentUser, likedIds, onLike, onReply, onDelete, depth = 0 }) {
  const [showReply, setShowReply] = useState(false);
  const replies = comment.replies || [];
  const isLiked = likedIds.has(comment.id);
  const isOwn = currentUser === comment.user_name;

  const handleReply = async (text) => {
    await onReply(comment.id, text);
    setShowReply(false);
  };

  return (
    <div className={depth > 0 ? "ml-4 border-l border-[var(--border)] pl-4 sm:ml-7" : ""}>
      <div
        className="group relative overflow-hidden rounded-[24px] border p-5 transition-all duration-200 hover:-translate-y-0.5"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ background: "radial-gradient(circle at top right, rgba(167,139,250,0.1), transparent 40%)" }}
        />
        <div className="relative flex gap-3">
          <UserAvatar name={comment.user_name} size="sm" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-[var(--text-primary)]">{comment.user_name}</span>
              <span className="text-xs font-medium text-[var(--text-muted)]">{timeAgo(comment.created_at)}</span>
            </div>

            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{comment.content}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onLike(comment.id)}
                className={`inline-flex items-center gap-1.5 rounded-[14px] border px-3 py-1.5 text-xs font-bold transition-all ${
                  isLiked ? "border-rose-300/25 bg-rose-400/10 text-rose-300" : "border-[var(--border)] text-[var(--text-primary)]"
                }`}
              >
                <Icon d={icons.heart} size={13} filled={isLiked} />
                <span>{comment.likes || 0}</span>
              </button>

              {currentUser ? (
                <button
                  onClick={() => setShowReply((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-[14px] border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)]"
                >
                  <Icon d={icons.reply} size={13} />
                  Reply
                </button>
              ) : null}

              {isOwn ? (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="inline-flex items-center gap-1.5 rounded-[14px] border border-rose-300/20 px-3 py-1.5 text-xs font-bold text-rose-300"
                >
                  <Icon d={icons.trash} size={13} />
                  Delete
                </button>
              ) : null}
            </div>

            <AnimatePresence>
              {showReply ? (
                <ReplyComposer userName={currentUser} onSubmit={handleReply} onCancel={() => setShowReply(false)} />
              ) : null}
            </AnimatePresence>

            {replies.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3">
                {replies.map((reply) => (
                  <Comment
                    key={reply.id}
                    comment={reply}
                    currentUser={currentUser}
                    likedIds={likedIds}
                    onLike={onLike}
                    onReply={onReply}
                    onDelete={onDelete}
                    depth={depth + 1}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const userName = user?.username ? `@${user.username}` : user?.email?.split("@")[0] ?? "";

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [likedIds, setLikedIds] = useState(new Set());

  const fetchComments = async () => {
    try {
      const res = await api.get("/community/comments");
      setComments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);
    await api.post("/community/comments", {
      user_id: user?.id ? parseInt(user.id) : null,
      user_name: userName,
      content: text,
    });
    setText("");
    setShowComposer(false);
    setPosting(false);
    fetchComments();
  };

  const handleReply = async (parentId, content) => {
    await api.post("/community/comments", {
      user_id: user?.id ? parseInt(user.id) : null,
      user_name: userName,
      content,
      parent_id: parentId,
    });
    fetchComments();
  };

  const handleLike = async (id) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    await api.post(`/community/comments/${id}/like`);
    fetchComments();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this comment?")) return;
    await api.delete(`/community/comments/${id}`, { params: { user_name: userName } });
    fetchComments();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-28 pt-[84px] sm:px-5">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <motion.section
          {...fadeUp(0)}
          className="theme-hero relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-7 shadow-[0_28px_90px_rgba(3,7,18,0.34)] sm:px-8 sm:py-9"
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
                Community
              </p>
              <h1 className="mt-3 max-w-3xl text-[36px] font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-[52px]">
                Learn faster with people preparing beside you.
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-200/80 sm:text-[16px]">
                Ask questions, share interview experiences, reply to other candidates, and keep prep from feeling like
                a solo grind.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {QUICK_SIGNALS.map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                Discussion Preview
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Signed in as</p>
                  <p className="mt-1 truncate text-lg font-bold text-white">{userName || "Guest"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                  <div className="rounded-2xl bg-white/6 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Threads</p>
                    <p className="mt-1 text-base font-bold text-white">{loading ? "-" : comments.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white/6 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Mode</p>
                    <p className="mt-1 text-base font-bold text-white">Peer prep</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {userName ? (
          <motion.div {...fadeUp(0.08)}>
            <Panel
              eyebrow="New Discussion"
              title="Start a thread"
              description="Post a question, share an interview moment, or ask for help turning feedback into a concrete prep move."
              aside={
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Posting as
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <UserAvatar name={userName} size="sm" />
                    <p className="text-sm font-bold text-[var(--text-primary)]">{userName}</p>
                  </div>
                </div>
              }
            >
              <AnimatePresence mode="wait">
                {!showComposer ? (
                  <motion.button
                    key="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowComposer(true)}
                    className="inline-flex min-h-[52px] w-fit items-center gap-2 rounded-[20px] px-5 text-sm font-bold text-white"
                    style={{
                      background: "var(--brand-gradient)",
                      boxShadow: "0 18px 50px rgba(125, 211, 252, 0.18)",
                    }}
                  >
                    <Icon d={icons.post} size={15} />
                    New Post
                  </motion.button>
                ) : (
                  <motion.div
                    key="composer"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-[26px] border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar name={userName} size="md" />
                      <span className="text-sm font-bold text-[var(--text-primary)]">{userName}</span>
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={4}
                      placeholder="What's on your mind?"
                      autoFocus
                      className="mt-4 w-full resize-none rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 text-sm leading-7 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                    />
                    <div className="mt-3 flex justify-end gap-2 border-t border-[var(--border)] pt-3">
                      <button
                        onClick={() => {
                          setShowComposer(false);
                          setText("");
                        }}
                        className="rounded-[16px] px-4 py-2 text-xs font-bold text-[var(--text-primary)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePost}
                        disabled={!text.trim() || posting}
                        className="rounded-[16px] px-5 py-2 text-xs font-bold text-white transition-all disabled:opacity-40"
                        style={{ background: "var(--brand-gradient)" }}
                      >
                        {posting ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          </motion.div>
        ) : null}

        <motion.div {...fadeUp(0.14)}>
          <Panel
            eyebrow="Threads"
            title="Community discussions"
            description="Browse recent prep conversations, add replies, and mark helpful posts."
            aside={
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Community rhythm
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                  Keep posts specific: role, question type, what you tried, and where you got stuck.
                </p>
              </div>
            }
          >
            {loading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)]"
                  />
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[24px] border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-16 text-center">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-[20px] border text-violet-300"
                  style={{ background: colors.violet.bg, borderColor: colors.violet.border }}
                >
                  <Icon d={icons.spark} size={22} />
                </span>
                <p className="mt-4 text-sm font-bold text-[var(--text-primary)]">No discussions yet.</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Start the first prep thread.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                  >
                    <Comment
                      comment={comment}
                      currentUser={userName}
                      likedIds={likedIds}
                      onLike={handleLike}
                      onReply={handleReply}
                      onDelete={handleDelete}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>
      </div>
    </div>
  );
}
