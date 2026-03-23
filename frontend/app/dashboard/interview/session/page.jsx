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

function ScoreBadge({ label, val }) {
  const color = val >= 7 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : val >= 4 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
              :             "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${color}`}>
      {label}: {val}/10
    </span>
  );
}

function Message({ role, content, score }) {
  const isAI = role === "assistant";
  return (
    <div className={`flex gap-2 items-end mb-3 ${isAI ? "justify-start" : "justify-end"}`}>
      {isAI && (
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold border"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
          AI
        </div>
      )}
      <div style={{ maxWidth: "85%" }}>
        <div className="px-3 py-2.5 text-[13px] leading-relaxed"
          style={{
            background: isAI ? "var(--bg-card)" : "var(--text-primary)",
            color: isAI ? "var(--text-primary)" : "var(--bg-primary)",
            border: isAI ? "1px solid var(--border)" : "none",
            borderRadius: isAI ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
          }}>
          {content}
        </div>
        {score && (
          <div className="flex gap-1.5 mt-1.5 flex-wrap justify-end">
            <ScoreBadge label="Correctness" val={score.correctness} />
            <ScoreBadge label="Depth"       val={score.depth} />
            <ScoreBadge label="Clarity"     val={score.clarity} />
          </div>
        )}
      </div>
      {!isAI && (
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold border"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
          You
        </div>
      )}
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
      });

      setMessagesSync(prev => {
        const c = [...prev];
        c[c.length - 1] = { ...c[c.length - 1], score: res.data.score };
        return c;
      });

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
    rec.lang = "en-US"; rec.continuous = true; rec.interimResults = true;
    recognitionRef.current = rec;

    const finalParts = []; let interimText = "";
    const clean = t => t.trim().replace(/\s+/g, " ");

    rec.onstart  = () => setMicOn(true);
    rec.onerror  = e  => { if (e.error !== "no-speech") setMicOn(false); };
    rec.onend    = ()  => setMicOn(false);
    rec.onresult = e  => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) { finalParts.push(clean(t)); interimText = ""; }
        else interimText = clean(t);
      }
      const display = [finalParts.join(" ").trim(), interimText].filter(Boolean).join(" ");
      setAnswer(display);
      answerRef.current = display;

      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const final = [...finalParts, ...(interimText ? [interimText] : [])].join(" ").trim();
        if (final) {
          answerRef.current = final;
          setAnswer(final);
          stopListening();
          setTimeout(() => doSubmit(answerRef.current), 100);
        }
      }, 2500);
    };
    rec.start();
  };

  // ── Init ───────────────────────────────────────────────────────────────────
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
        sessionStorage.setItem("interviewResult", JSON.stringify({
          ...res.data,
          roleTitle: sess.roleTitle,
          level:     sess.level,
        }));
      } catch {
        sessionStorage.setItem("interviewResult", JSON.stringify({
          overall_score: 0,
          summary:       "Could not load summary.",
          strengths:     [],
          improvements:  [],
          roleTitle:     sess.roleTitle || "Interview",
          level:         sess.level     || "MEDIUM",
        }));
      }
    }

    sessionStorage.removeItem("interviewSession");
    router.push("/dashboard/interview/result");
  };

  if (!session) return null;
  const lc = LEVEL_COLOR[currentLevel] || LEVEL_COLOR.MEDIUM;

  return (
    <ProtectedRoute>
      <div className="flex flex-col"
        style={{ height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>

        {/* ── TOP BAR ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[14px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              AI Interview
            </span>
            <span className="text-[13px] font-light" style={{ color: "var(--text-muted)" }}>
              — {session.roleTitle}
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${lc.text} ${lc.bg} ${lc.border}`}>
              {currentLevel}
            </span>
          </div>
          <button
            onClick={endInterview}
            disabled={ending}
            className="text-xs font-semibold px-4 py-2 rounded-lg border transition-opacity hover:opacity-80 disabled:opacity-50 flex items-center gap-2"
            style={{ background: "rgba(244,63,94,0.08)", borderColor: "rgba(244,63,94,0.2)", color: "#fb7185" }}>
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
          <div className="mx-5 mt-2 flex-shrink-0 flex items-center gap-2 text-[13px] px-4 py-2.5 rounded-xl border"
            style={{ background: "rgba(244,63,94,0.08)", color: "#fb7185", borderColor: "rgba(244,63,94,0.18)" }}>
            ⚠ {error}
          </div>
        )}

        {/* ── ENDING OVERLAY ── */}
        {ending && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4"
            style={{ background: "var(--bg-primary)" }}>
            <span className="w-10 h-10 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--text-primary)" }} />
            <p className="text-sm font-light" style={{ color: "var(--text-muted)" }}>
              Generating your results…
            </p>
          </div>
        )}

        {/* ── MAIN LAYOUT ── */}
        <div className="flex-1 grid min-h-0" style={{ gridTemplateColumns: "1fr 300px" }}>

          {/* ── LEFT: VIDEO ── */}
          <div className="flex flex-col gap-3 p-4 min-h-0">
            <div className="relative flex-1 rounded-2xl overflow-hidden border min-h-0"
              style={{ background: "#000", borderColor: "var(--border)" }}>
              <video ref={videoRef} autoPlay muted playsInline
                className="w-full h-full object-cover"
                style={{ display: cameraOn ? "block" : "none", transform: "scaleX(-1)" }} />
              {!cameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ color: "var(--text-muted)" }}>
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
                  <span className="text-[11px] text-red-400 font-semibold">REC</span>
                </div>
              )}
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button onClick={cameraOn ? stopCamera : startCamera}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                    cameraOn ? "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" : "border-white/20 text-white/50"
                  }`}
                  style={!cameraOn ? { background: "rgba(0,0,0,0.5)" } : {}}>
                  {cameraOn ? "Camera On" : "Camera Off"}
                </button>
                <button onClick={recording ? stopRecording : startRecording} disabled={!cameraOn}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all disabled:opacity-30 ${
                    recording ? "text-red-400 bg-red-500/20 border-red-500/30" : "border-white/20 text-white/50"
                  }`}
                  style={!recording ? { background: "rgba(0,0,0,0.5)" } : {}}>
                  {recording ? "■ Stop" : "⏺ Record"}
                </button>
                {recordedUrl && (
                  <button onClick={downloadRecording}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-white/20 text-white/50"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    ↓ Save
                  </button>
                )}
              </div>
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 flex flex-col gap-2">
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
                  <span className="text-[12px] font-light" style={{ color: "var(--text-muted)" }}>
                    {micOn ? "Listening…" : aiSpeaking ? "AI speaking…" : loading ? "Evaluating…" : "Ready"}
                  </span>
                </div>
                <button
                  onClick={() => { const next = !voiceMode; setVoiceMode(next); voiceModeRef.current = next; if (!next) stopListening(); }}
                  className="text-[11px] font-semibold px-3 py-1 rounded-full border transition-all"
                  style={voiceMode
                    ? { background: "var(--bg-card)", borderColor: "var(--text-primary)", color: "var(--text-primary)" }
                    : { background: "var(--bg-card)", borderColor: "var(--border)",       color: "var(--text-muted)" }}>
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
                    style={!micOn ? { background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" } : {}}>
                    {micOn ? "■" : "🎙"}
                  </button>
                )}
                <textarea
                  value={answer}
                  onChange={e => { setAnswer(e.target.value); answerRef.current = e.target.value; }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSubmit(answerRef.current); } }}
                  placeholder={voiceMode ? "Spoken answer appears here…" : "Type your answer…"}
                  rows={2}
                  className="flex-1 rounded-xl px-4 py-2.5 text-[13px] font-light outline-none resize-none border"
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
          <div className="flex flex-col border-l min-h-0" style={{ borderColor: "var(--border)" }}>
            <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 border-b"
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
                <p className="text-[13px] font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                  AI Interviewer
                </p>
                <p className="text-[11px] font-light" style={{ color: "var(--text-muted)" }}>
                  {aiSpeaking ? "Asking…" : loading ? "Evaluating…" : micOn ? "Listening…" : "Waiting"}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
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