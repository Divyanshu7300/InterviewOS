"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";

const HeartIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

const ReplyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
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
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="mt-3 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
    >
      <div className="flex items-center gap-2">
        <UserAvatar name={userName} size="sm" />
        <span className="text-[12px] font-medium text-[var(--text-primary)]">{userName}</span>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
        placeholder="Write a reply..."
        autoFocus
        className="w-full resize-none bg-transparent text-sm text-[var(--text-primary)] outline-none"
      />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[var(--text-primary)] transition-all">
          Cancel
        </button>
        <button onClick={submit} disabled={!text.trim() || posting}
          className="rounded-lg bg-[var(--text-primary)] px-4 py-1.5 text-[12px] font-semibold text-[var(--bg-primary)] transition-all disabled:opacity-40">
          {posting ? "Posting…" : "Reply"}
        </button>
      </div>
    </motion.div>
  );
}

function Comment({ comment, currentUser, likedIds, onLike, onReply, onDelete, depth = 0 }) {
  const [showReply, setShowReply] = useState(false);
  const replies  = comment.replies || [];
  const isLiked  = likedIds.has(comment.id);
  const isOwn    = currentUser === comment.user_name;

  const handleReply = async (text) => {
    await onReply(comment.id, text);
    setShowReply(false);
  };

  return (
    <div style={{ marginLeft: depth > 0 ? "28px" : "0px" }}>
      <div className="flex gap-3 py-5 border-b"
        style={{ borderColor: "var(--border)" }}>

        <UserAvatar name={comment.user_name} size="sm" />

        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {comment.user_name}
            </span>
            <span className="text-sm text-[var(--text-primary)]">
              {timeAgo(comment.created_at)}
            </span>
          </div>

          {/* Content */}
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">

            {/* Like */}
            <button
              onClick={() => onLike(comment.id)}
              className="flex items-center gap-1.5 text-[12px] font-medium transition-all"
              style={{ color: isLiked ? "#f43f5e" : "var(--text-primary)" }}
            >
              <HeartIcon filled={isLiked} />
              <span>{comment.likes || 0}</span>
            </button>

            {/* Reply */}
            {currentUser && (
              <button
                onClick={() => setShowReply(v => !v)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-primary)] transition-all"
              >
                <ReplyIcon />
                Reply
              </button>
            )}

            {/* Delete */}
            {isOwn && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-primary)] transition-all hover:text-rose-400"
              >
                <TrashIcon />
                Delete
              </button>
            )}
          </div>

          {/* Reply composer */}
          <AnimatePresence>
            {showReply && (
              <ReplyComposer
                userName={currentUser}
                onSubmit={handleReply}
                onCancel={() => setShowReply(false)}
              />
            )}
          </AnimatePresence>

          {/* Nested replies */}
          {replies.length > 0 && (
            <div className="mt-2 border-l pl-4"
              style={{ borderColor: "var(--border)" }}>
              {replies.map(r => (
                <Comment
                  key={r.id}
                  comment={r}
                  currentUser={currentUser}
                  likedIds={likedIds}
                  onLike={onLike}
                  onReply={onReply}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const userName = user?.username ? `@${user.username}` : user?.email?.split("@")[0] ?? "";

  const [comments,     setComments]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [text,         setText]         = useState("");
  const [posting,      setPosting]      = useState(false);
  const [likedIds,     setLikedIds]     = useState(new Set());

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

  useEffect(() => { fetchComments(); }, []);

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
    // Optimistic toggle
    setLikedIds(prev => {
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
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pb-24 pt-[80px] sm:px-5">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-6"
        >
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-primary)]">
            Community
          </p>
          <h1 className="text-[32px] font-bold text-[var(--text-primary)]">
            Discussion
          </h1>
          <p className="mt-2 text-base text-[var(--text-primary)]">
            Ask questions and help other developers.
          </p>
        </motion.div>

        {/* ── COMPOSER ── */}
        {userName && (
          <div>
            <AnimatePresence mode="wait">
              {!showComposer ? (
                <motion.button
                  key="btn"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowComposer(true)}
                  className="rounded-xl bg-[var(--text-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--bg-primary)] transition-all"
                >
                  + New Post
                </motion.button>
              ) : (
                <motion.div
                  key="composer"
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar name={userName} size="md" />
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {userName}
                    </span>
                  </div>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={4}
                    placeholder="What's on your mind?"
                    autoFocus
                    className="w-full resize-none bg-transparent text-sm leading-relaxed text-[var(--text-primary)] outline-none"
                  />
                  <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-3">
                    <button onClick={() => { setShowComposer(false); setText(""); }}
                      className="rounded-xl px-4 py-2 text-[12px] font-medium text-[var(--text-primary)] transition-all">
                      Cancel
                    </button>
                    <button onClick={handlePost} disabled={!text.trim() || posting}
                      className="rounded-xl bg-[var(--text-primary)] px-5 py-2 text-[12px] font-semibold text-[var(--bg-primary)] transition-all disabled:opacity-40">
                      {posting ? "Posting…" : "Post"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── COMMENTS ── */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse"
                style={{ background: "var(--bg-secondary)" }} />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-16">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No discussions yet — be the first to post!
            </p>
          </div>
        ) : (
          <div>
            {comments.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Comment
                  comment={c}
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

      </div>
    </div>
  );
}
