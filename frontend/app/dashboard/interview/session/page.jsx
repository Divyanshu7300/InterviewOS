"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/axios";
import ProtectedRoute from "../../../../components/ProtectedRoute";

const LEVEL_COLOR = {
  EASY:   { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  MEDIUM: { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  HARD:   { text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20" },
};

const BAR_HEIGHTS = [8, 14, 20, 12, 24, 10, 18, 22, 8, 16, 26, 10, 20, 14, 18, 12];
const TARGET_ROUNDS = 24;
const METRIC_META = {
  confidence: { label: "Confidence", accent: "#a78bfa" },
  correctness: { label: "Correctness", accent: "#4ade80" },
  depth: { label: "Depth", accent: "#38bdf8" },
  clarity: { label: "Clarity", accent: "#f59e0b" },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const average = (items) => items.length ? items.reduce((sum, item) => sum + item, 0) / items.length : 0;

function deriveInterviewAnalytics(messages, currentLevel) {
  const answers = messages.filter(message => message.role === "user");
  const scoredAnswers = answers.filter(message => message.score);
  const answeredCount = answers.length;
  const progressPct = clamp((answeredCount / TARGET_ROUNDS) * 100, 0, 100);
  const metricAverages = {
    confidence: average(scoredAnswers.map(message => message.score.confidence ?? 0)),
    correctness: average(scoredAnswers.map(message => message.score.correctness)),
    depth: average(scoredAnswers.map(message => message.score.depth)),
    clarity: average(scoredAnswers.map(message => message.score.clarity)),
  };
  const strongestMetric = Object.entries(metricAverages).sort((a, b) => b[1] - a[1])[0]?.[0] || "correctness";
  const weakestMetric = Object.entries(metricAverages).sort((a, b) => a[1] - b[1])[0]?.[0] || "depth";
  const recentScores = scoredAnswers.slice(-2).map(message =>
    average([message.score.correctness, message.score.depth, message.score.clarity])
  );
  const momentumValue = recentScores.length === 2 ? recentScores[1] - recentScores[0] : recentScores[0] || 0;
  const momentumLabel = momentumValue > 0.35 ? "Rising"
    : momentumValue < -0.35 ? "Dropping"
    : answeredCount > 0 ? "Steady"
    : "Warming up";
  const focusCue = weakestMetric === "depth"
    ? "Push 1 layer deeper with tradeoffs or system thinking."
    : weakestMetric === "clarity"
      ? "Use a crisp structure before diving into detail."
      : "Anchor answers with concrete, technically accurate choices.";
  const challengePrompt = currentLevel === "HARD"
    ? "Pressure round: explain your decision and the tradeoff you rejected."
    : currentLevel === "EASY"
      ? "Warm-up round: answer confidently and keep the structure clean."
      : "Level-up round: add one real example after your main point.";

  return {
    answeredCount,
    progressPct,
    metricAverages,
    strongestMetric,
    weakestMetric,
    momentumLabel,
    focusCue,
    challengePrompt,
  };
}

function ScoreBadge({ label, val }) {
  const color = val >= 7 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : val >= 4 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
              :             "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={`rounded-full border px-2.5 py-1 text-sm font-medium ${color}`}>
      {label}: {val}/10
    </span>
  );
}

function Message({ role, content, score }) {
  const isAI = role === "assistant";
  return (
    <div className={`flex gap-2 items-end mb-3 ${isAI ? "justify-start" : "justify-end"}`}>
      {isAI && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] font-bold text-[var(--text-primary)]">
          AI
        </div>
      )}
      <div className="max-w-[85%]">
        <div className="px-3 py-2.5 text-[13px] leading-relaxed"
          style={{
            background: isAI ? "var(--bg-card)" : "var(--text-primary)",
            color: isAI ? "var(--text-primary)" : "var(--bg-primary)",
            border: isAI ? "1px solid var(--border)" : "none",
            borderRadius: isAI ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
          }}>
          {content}
        </div>
      </div>
      {!isAI && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] font-bold text-[var(--text-primary)]">
          You
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, accent }) {
  return (
    <div className="min-w-[112px] rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-3">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]">
        {label}
      </p>
      <p className="mt-1 text-[15px] font-bold" style={{ color: accent || "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}

function MetricRail({ metric, value }) {
  const meta = METRIC_META[metric];
  const pct = clamp((value / 10) * 100, 0, 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
          {meta.label}
        </span>
        <span className="text-sm font-semibold" style={{ color: meta.accent }}>
          {value.toFixed(1)}/10
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: meta.accent }} />
      </div>
    </div>
  );
}

export default function InterviewSessionPage() {
  const router = useRouter();

  const [session,      setSession]      = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [currentLevel, setCurrentLevel] = useState("MEDIUM");
  const [answer,       setAnswer]       = useState("");
  const [loading,      setLoading]      = useState(false);
  const [aiSpeaking,   setAiSpeaking]   = useState(false);
  const [error,        setError]        = useState(null);
  const [micOn,        setMicOn]        = useState(false);
  const [voiceMode,    setVoiceMode]    = useState(true);
  const [ending,       setEnding]       = useState(false); // ← new
  const [liveInsights, setLiveInsights] = useState(null);
  const [lastEvaluation, setLastEvaluation] = useState(null);

  const videoRef          = useRef(null);
  const [cameraOn,     setCameraOn]     = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const mediaRecorderRef  = useRef(null);
  const recordedChunksRef = useRef([]);
  const [recording,    setRecording]    = useState(false);
  const [recordedUrl,  setRecordedUrl]  = useState(null);

  const recognitionRef  = useRef(null);
  const silenceTimerRef = useRef(null);
  const hasInitialized  = useRef(false);
  const ttsSpokenRef    = useRef(new Set());
  const transcriptEnd   = useRef(null);
  const finalTranscriptRef = useRef("");

  const answerRef      = useRef("");
  const sessionRef     = useRef(null);
  const voiceModeRef   = useRef(true);
  const loadingRef     = useRef(false);
  const aiSpeakingRef  = useRef(false);
  const messagesRef    = useRef([]);

  const setMessagesSync = (updater) => {
    setMessages(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      messagesRef.current = next;
      return next;
    });
  };

  useEffect(() => { answerRef.current     = answer;     }, [answer]);
  useEffect(() => { sessionRef.current    = session;    }, [session]);
  useEffect(() => { voiceModeRef.current  = voiceMode;  }, [voiceMode]);
  useEffect(() => { loadingRef.current    = loading;    }, [loading]);
  useEffect(() => { aiSpeakingRef.current = aiSpeaking; }, [aiSpeaking]);
  useEffect(() => { transcriptEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── stopListening ──────────────────────────────────────────────────────────
  const stopListening = () => {
    clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setMicOn(false);
  };

  // ── doSubmit ───────────────────────────────────────────────────────────────
  const doSubmit = async (ans) => {
    const trimmed = (ans || "").trim().replace(/\s+/g, " ");
    const sess    = sessionRef.current;
    if (!trimmed || !sess || loadingRef.current) return;

    stopListening();
    window.speechSynthesis?.cancel();

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setAnswer("");
    answerRef.current = "";

    setMessagesSync(prev => [...prev, { role: "user", content: trimmed }]);

    try {
      const res = await api.post("/interview/answer", {
        session_id: sess.sessionId,
        answer:     trimmed,
        user_id:    sess.userId,
        candidate_preferences: sess.candidatePreferences || null,
      });

      setMessagesSync(prev => {
        const c = [...prev];
        c[c.length - 1] = {
          ...c[c.length - 1],
          score: res.data.score,
          evaluation: res.data.evaluation,
        };
        return c;
      });

      setLiveInsights(res.data.session_insights);
      setLastEvaluation(res.data.evaluation);
      setCurrentLevel(res.data.next_level);
      const nextQ = res.data.next_question;
      setMessagesSync(prev => [...prev, { role: "assistant", content: nextQ }]);
      setTimeout(() => speakOnce(nextQ), 300);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Could not submit your answer. Please try again.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  // ── speakOnce ──────────────────────────────────────────────────────────────
  const speakOnce = (text) => {
    if (!window.speechSynthesis || ttsSpokenRef.current.has(text)) return;
    ttsSpokenRef.current.add(text);
    window.speechSynthesis.cancel();
    aiSpeakingRef.current = true;
    setAiSpeaking(true);

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US"; utt.rate = 0.92; utt.pitch = 1.0;
    const voices    = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      ["Google US English", "Samantha", "Microsoft Aria Online (Natural)", "Microsoft Zira"].includes(v.name)
    ) || voices.find(v => v.lang.startsWith("en-"));
    if (preferred) utt.voice = preferred;

    const onDone = () => {
      aiSpeakingRef.current = false;
      setAiSpeaking(false);
      if (voiceModeRef.current) startListening();
    };
    utt.onend = utt.onerror = onDone;
    window.speechSynthesis.speak(utt);
  };

  // ── startListening ─────────────────────────────────────────────────────────
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (recognitionRef.current) recognitionRef.current.abort();

    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    finalTranscriptRef.current = "";
    let interimText = "";
    const clean = t => t.trim().replace(/\s+/g, " ");

    rec.onstart  = () => setMicOn(true);
    rec.onerror  = e  => {
      if (e.error !== "no-speech" && e.error !== "aborted") setMicOn(false);
    };
    rec.onend    = ()  => {
      setMicOn(false);
      if (
        voiceModeRef.current &&
        !loadingRef.current &&
        !aiSpeakingRef.current &&
        answerRef.current.trim() &&
        recognitionRef.current === rec
      ) {
        setTimeout(() => startListening(), 150);
      }
    };
    rec.onresult = e  => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          const nextPart = clean(t);
          finalTranscriptRef.current = [finalTranscriptRef.current, nextPart].filter(Boolean).join(" ").trim();
          interimText = "";
        } else {
          interimText = clean(t);
        }
      }
      const display = [finalTranscriptRef.current, interimText].filter(Boolean).join(" ").trim();
      setAnswer(display);
      answerRef.current = display;

      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const final = [finalTranscriptRef.current, interimText].filter(Boolean).join(" ").trim();
        if (final) {
          answerRef.current = final;
          setAnswer(final);
          stopListening();
          setTimeout(() => doSubmit(answerRef.current), 100);
        }
      }, 3500);
    };
    rec.start();
  };

  // ── Init ───────────────────────────────────────────────────────────────────
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const raw = sessionStorage.getItem("interviewSession");
    if (!raw) { router.push("/dashboard/interview"); return; }

    const s = JSON.parse(raw);
    sessionRef.current = s;
    setSession(s);
    setCurrentLevel(s.level);

    const firstMsg = [{ role: "assistant", content: s.firstQuestion }];
    messagesRef.current = firstMsg;
    setMessages(firstMsg);

    const trySpeak = () => {
      const voices = window.speechSynthesis?.getVoices();
      if (voices?.length) speakOnce(s.firstQuestion);
      else window.speechSynthesis?.addEventListener(
        "voiceschanged", () => speakOnce(s.firstQuestion), { once: true }
      );
    };
    setTimeout(trySpeak, 400);
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => () => { stopListening(); window.speechSynthesis?.cancel(); }, []);

  // ── Camera ─────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraStream(stream); setCameraOn(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { setError("Camera access denied."); }
  };

  const stopCamera = () => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null); setCameraOn(false); setRecording(false);
  };

  const startRecording = () => {
    if (!cameraStream) return;
    recordedChunksRef.current = [];
    const mr = new MediaRecorder(cameraStream, { mimeType: "video/webm" });
    mr.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
    mr.onstop = () => setRecordedUrl(URL.createObjectURL(
      new Blob(recordedChunksRef.current, { type: "video/webm" })
    ));
    mr.start();
    mediaRecorderRef.current = mr;
    setRecording(true);
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  const downloadRecording = () => {
    if (!recordedUrl) return;
    const a = document.createElement("a");
    a.href = recordedUrl;
    a.download = `interview-${sessionRef.current?.sessionId || "session"}.webm`;
    a.click();
  };

  // ── endInterview — fetch summary then redirect ─────────────────────────────
  const endInterview = async () => {
    stopListening();
    window.speechSynthesis?.cancel();
    stopCamera();
    setEnding(true);

    const sess = sessionRef.current;
    if (sess?.sessionId) {
      try {
        const res = await api.post(`/interview/finish/${sess.sessionId}`);
        const transcript = messagesRef.current
          .filter(message => message.role === "assistant" || message.role === "user")
          .map(message => ({
            role: message.role,
            content: message.content,
            score: message.score || null,
            evaluation: message.evaluation || null,
          }));
        const answeredCount = transcript.filter(message => message.role === "user").length;
        const analytics = deriveInterviewAnalytics(messagesRef.current, currentLevel);
        sessionStorage.setItem("interviewResult", JSON.stringify({
          ...res.data,
          sessionId: sess.sessionId,
          roleTitle: sess.roleTitle,
          level:     sess.level,
          finishedLevel: currentLevel,
          transcript,
          answeredCount,
          durationMinutes: sess.startedAt
            ? Math.max(1, Math.round((Date.now() - sess.startedAt) / 60000))
            : null,
          targetRounds: sess.targetRounds || TARGET_ROUNDS,
          analytics,
        }));
      } catch {
        sessionStorage.setItem("interviewResult", JSON.stringify({
          overall_score: 0,
          summary:       "Could not load summary.",
          strengths:     [],
          improvements:  [],
          sessionId:     sess.sessionId,
          roleTitle:     sess.roleTitle || "Interview",
          level:         sess.level     || "MEDIUM",
          finishedLevel: currentLevel,
          transcript:    [],
          answeredCount: 0,
          durationMinutes: sess.startedAt
            ? Math.max(1, Math.round((Date.now() - sess.startedAt) / 60000))
            : null,
          targetRounds:  sess.targetRounds || TARGET_ROUNDS,
          analytics:     deriveInterviewAnalytics(messagesRef.current, currentLevel),
        }));
      }
    }

    sessionStorage.removeItem("interviewSession");
    router.push("/dashboard/interview/result");
  };

  if (!session) return null;
  const lc = LEVEL_COLOR[currentLevel] || LEVEL_COLOR.MEDIUM;
  const fallbackAnalytics = deriveInterviewAnalytics(messages, currentLevel);
  const analytics = liveInsights ? {
    answeredCount: Math.round((liveInsights.response_progress / 100) * (session.targetRounds || TARGET_ROUNDS)),
    progressPct: liveInsights.response_progress,
    metricAverages: {
      confidence: liveInsights.skill_scores.confidence ?? 0,
      correctness: liveInsights.skill_scores.correctness ?? 0,
      depth: liveInsights.skill_scores.depth ?? 0,
      clarity: liveInsights.skill_scores.clarity ?? 0,
    },
    strongestMetric: liveInsights.best_signal,
    weakestMetric: liveInsights.weakest_signal,
    momentumLabel: liveInsights.momentum,
    focusCue: lastEvaluation?.improvement_hint || fallbackAnalytics.focusCue,
    challengePrompt: fallbackAnalytics.challengePrompt,
  } : fallbackAnalytics;
  const durationMinutes = session?.startedAt
    ? Math.max(1, Math.round((Date.now() - session.startedAt) / 60000))
    : 0;

  return (
    <ProtectedRoute>
      <div className="mt-[72px] h-[calc(100dvh-72px)] overflow-hidden bg-[var(--bg-primary)]">

        {/* ── TOP BAR ── */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[14px] font-bold tracking-tight text-[var(--text-primary)]">
              AI Interview
            </span>
            <span className="text-[13px] font-light text-[var(--text-primary)]">
              — {session.roleTitle}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-sm font-semibold ${lc.text} ${lc.bg} ${lc.border}`}>
              {currentLevel}
            </span>
          </div>
          <button
            onClick={endInterview}
            disabled={ending}
            className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 transition-opacity hover:opacity-80 disabled:opacity-50">
            {ending ? (
              <>
                <span className="w-3 h-3 border-2 rounded-full animate-spin inline-block"
                  style={{ borderColor: "rgba(251,113,133,0.3)", borderTopColor: "#fb7185" }} />
                Finishing…
              </>
            ) : "End Session"}
          </button>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="mx-5 mt-2 flex shrink-0 items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-[13px] text-rose-400">
            ⚠ {error}
          </div>
        )}

        {/* ── ENDING OVERLAY ── */}
        {ending && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[var(--bg-primary)]">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--text-primary)]" />
            <p className="text-sm text-[var(--text-primary)]">
              Generating your results…
            </p>
          </div>
        )}

        {/* ── MAIN LAYOUT ── */}
        <div className="grid h-[calc(100%-3.5rem)] min-h-0 flex-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_340px]">

          {/* ── LEFT: VIDEO ── */}
          <div className="flex min-h-0 flex-col gap-3 overflow-hidden p-3 sm:p-4">
            <div className="rounded-[26px] border overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(59,130,246,0.08) 45%, rgba(245,158,11,0.08))",
                borderColor: "rgba(255,255,255,0.08)",
              }}>
              <div className="px-4 py-4 flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <StatChip label="Momentum" value={analytics.momentumLabel} accent="#38bdf8" />
                  <StatChip label="Responses" value={`${analytics.answeredCount}/${session.targetRounds || TARGET_ROUNDS}`} accent="#4ade80" />
                  <StatChip label="Time" value={`${durationMinutes} min`} accent="#f59e0b" />
                  <StatChip label="Overall" value={lastEvaluation ? `${lastEvaluation.score.toFixed(1)}/10` : "—"} accent="#a78bfa" />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]">
                      Confidence Track
                    </span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {Math.round(analytics.progressPct)}% to full mock
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${analytics.progressPct}%`,
                        background: "linear-gradient(90deg, #4ade80, #38bdf8 55%, #f59e0b)",
                      }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border"
              style={{ background: "#000", borderColor: "var(--border)" }}>
              <video ref={videoRef} autoPlay muted playsInline
                className="w-full h-full object-cover"
                style={{ display: cameraOn ? "block" : "none", transform: "scaleX(-1)" }} />
              {!cameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ color: "var(--text-primary)" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14"/>
                    <rect x="2" y="7" width="13" height="10" rx="3"/>
                  </svg>
                  <p className="text-sm font-light">Camera is off</p>
                </div>
              )}
              {recording && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(0,0,0,0.6)" }}>
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-sm font-semibold text-red-400">REC</span>
                </div>
              )}
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button onClick={cameraOn ? stopCamera : startCamera}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-all ${
                    cameraOn ? "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" : "border-white/20 text-white/50"
                  }`}
                  style={!cameraOn ? { background: "rgba(0,0,0,0.5)" } : {}}>
                  {cameraOn ? "Camera On" : "Camera Off"}
                </button>
                <button onClick={recording ? stopRecording : startRecording} disabled={!cameraOn}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-all disabled:opacity-30 ${
                    recording ? "text-red-400 bg-red-500/20 border-red-500/30" : "border-white/20 text-white/50"
                  }`}
                  style={!recording ? { background: "rgba(0,0,0,0.5)" } : {}}>
                  {recording ? "■ Stop" : "⏺ Record"}
                </button>
                {recordedUrl && (
                  <button onClick={downloadRecording}
                    className="rounded-full border border-white/20 px-3 py-1.5 text-sm font-semibold text-white/80"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    ↓ Save
                  </button>
                )}
              </div>
            </div>

            {/* Input area */}
            <div className="flex shrink-0 flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 h-6">
                  {micOn && (
                    <div className="flex items-end gap-[2px]">
                      {BAR_HEIGHTS.map((h, i) => (
                        <div key={i} className="w-[3px] rounded-full"
                          style={{
                            background: "var(--text-primary)",
                            height: `${h}px`,
                            animation: `bar${i % 4} 0.${4 + (i % 3)}s ease-in-out infinite alternate`,
                            opacity: 0.5 + (i % 3) * 0.2,
                          }} />
                      ))}
                    </div>
                  )}
                  <span className="text-[12px] font-light text-[var(--text-primary)]">
                    {micOn ? "Listening…" : aiSpeaking ? "AI speaking…" : loading ? "Evaluating…" : "Ready"}
                  </span>
                </div>
                <button
                  onClick={() => { const next = !voiceMode; setVoiceMode(next); voiceModeRef.current = next; if (!next) stopListening(); }}
                  className="text-[11px] font-semibold px-3 py-1 rounded-full border transition-all"
                  style={voiceMode
                    ? { background: "var(--bg-card)", borderColor: "var(--text-primary)", color: "var(--text-primary)" }
                    : { background: "var(--bg-card)", borderColor: "var(--border)",       color: "var(--text-primary)" }}>
                  {voiceMode ? "Voice ON" : "Voice OFF"}
                </button>
              </div>

              <div className="flex gap-2">
                {voiceMode && (
                  <button
                    onClick={() => { if (micOn) stopListening(); else if (!aiSpeakingRef.current && !loadingRef.current) startListening(); }}
                    className={`px-3 py-2.5 rounded-xl border text-sm transition-all flex-shrink-0 ${
                      micOn ? "text-red-400 bg-red-500/10 border-red-500/20" : ""
                    }`}
                    style={!micOn ? { background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" } : {}}>
                    {micOn ? "■" : "🎙"}
                  </button>
                )}
                <textarea
                  value={answer}
                  onChange={e => { setAnswer(e.target.value); answerRef.current = e.target.value; }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSubmit(answerRef.current); } }}
                  placeholder={voiceMode ? "Spoken answer appears here…" : "Type your answer…"}
                  rows={2}
                  className="max-h-28 min-h-[52px] flex-1 resize-none rounded-xl border px-4 py-2.5 text-[13px] font-light outline-none"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
                <button
                  onClick={() => doSubmit(answerRef.current)}
                  disabled={loading || !answer.trim()}
                  className="px-5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}>
                  {loading ? "…" : "Submit →"}
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: CHAT ── */}
          <div className="flex min-h-0 flex-col overflow-hidden border-l border-[var(--border)]">
            <div className="flex shrink-0 items-center gap-2.5 border-b px-4 py-3"
              style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center border text-[10px] font-bold flex-shrink-0 transition-all duration-300"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: aiSpeaking ? "var(--text-primary)" : "var(--border)",
                  color: "var(--text-primary)",
                }}>
                AI
              </div>
              <div>
                <p className="text-[13px] font-bold leading-tight text-[var(--text-primary)]">
                  AI Interviewer
                </p>
                <p className="text-[11px] text-[var(--text-primary)]">
                  {aiSpeaking ? "Asking…" : loading ? "Evaluating…" : micOn ? "Listening…" : "Waiting"}
                </p>
              </div>
            </div>
            <div className="shrink-0 border-b px-4 py-4"
              style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}>
              <div className="rounded-2xl border p-4 flex flex-col gap-4"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]">
                      Live Read
                    </p>
                    <p className="mt-1 text-[16px] font-bold text-[var(--text-primary)]">
                      {METRIC_META[analytics.strongestMetric]?.label || "Clarity"} is your edge
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                    style={{ color: "#38bdf8", borderColor: "rgba(56,189,248,0.2)", background: "rgba(56,189,248,0.08)" }}>
                    {analytics.momentumLabel}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {Object.keys(METRIC_META).map(metric => (
                    <MetricRail key={metric} metric={metric} value={analytics.metricAverages[metric]} />
                  ))}
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 overscroll-contain">
              {messages.map((msg, i) => (
                <Message key={i} role={msg.role} content={msg.content} score={msg.score} />
              ))}
              <div ref={transcriptEnd} />
            </div>
          </div>
        </div>

        <style>{`
          @keyframes bar0 { from { height: 6px;  } to { height: 22px; } }
          @keyframes bar1 { from { height: 10px; } to { height: 18px; } }
          @keyframes bar2 { from { height: 14px; } to { height: 26px; } }
          @keyframes bar3 { from { height: 8px;  } to { height: 16px; } }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
