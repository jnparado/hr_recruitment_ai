"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BrowserSpeechRecognizer,
  prefetchSpeechVoices,
  speakInBrowser,
  stopBrowserSpeech,
} from "@/lib/browser-voice";
import { INTERVIEW_QUESTION_LIMIT } from "@/lib/interview-config";
import {
  AiMeetingTile,
  CandidateCameraPreview,
  ZoomControl,
  formatRecordingTime,
} from "@/app/_components/InterviewRoomVoice";
import type { ChatMessage, InterviewEvaluation } from "@/lib/types";

type Phase = "loading" | "incoming" | "interview" | "evaluating" | "complete";
type VoiceState = "idle" | "speaking" | "recording" | "transcribing";
type SaveStage = "transcript" | "evaluate" | "score";

/**
 * AI Interview Room — Zoom-style meeting UI while in session.
 */
export default function CallPage() {
  const params = useParams();
  const applicationId = String(params.applicationId || "");
  const invalidLink = !applicationId || applicationId === "undefined";

  const [phase, setPhase] = useState<Phase>(invalidLink ? "incoming" : "loading");
  const [candidateName, setCandidateName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [thinking, setThinking] = useState(false);
  const [saveStage, setSaveStage] = useState<SaveStage>("transcript");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [meetingSeconds, setMeetingSeconds] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [supportOpen, setSupportOpen] = useState(false);

  const recorderRef = useRef<BrowserSpeechRecognizer | null>(null);
  const sessionRecorderRef = useRef<MediaRecorder | null>(null);
  const sessionChunksRef = useRef<Blob[]>([]);
  const sessionStreamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mutedRef = useRef(false);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    if (invalidLink) return;
    fetch(`/api/applications/${applicationId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setCandidateName(d.candidateName);
        setJobTitle(d.jobTitle);
        setJobDescription(d.jobDescription || "");
        setResumeText(d.resumeText || "");
        setAlreadyDone(d.alreadyInterviewed);
        setPhase(d.alreadyInterviewed ? "complete" : "incoming");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load application.");
        setPhase("incoming");
      });
  }, [applicationId, invalidLink]);

  useEffect(() => {
    prefetchSpeechVoices();
  }, []);

  useEffect(() => {
    if (voiceState === "recording") {
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [voiceState]);

  useEffect(() => {
    if (phase !== "interview" && phase !== "evaluating") return;
    setMeetingSeconds(0);
    const id = setInterval(() => setMeetingSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(
    () => () => {
      stopBrowserSpeech();
      sessionRecorderRef.current?.stop();
      sessionStreamRef.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );

  const questionsAsked = messages.filter((m) => m.role === "assistant").length;
  const currentQuestion =
    [...messages].reverse().find((m) => m.role === "assistant")?.content || "";
  const questionIndex = Math.min(
    Math.max(questionsAsked, 1),
    INTERVIEW_QUESTION_LIMIT
  );

  async function startSessionRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      sessionStreamRef.current = stream;
      sessionChunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) sessionChunksRef.current.push(e.data);
      };
      recorder.start(1000);
      sessionRecorderRef.current = recorder;
    } catch {
      // Interview can continue without a saved audio file
    }
  }

  async function stopSessionRecording(): Promise<Blob | null> {
    const recorder = sessionRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      sessionStreamRef.current?.getTracks().forEach((t) => t.stop());
      return null;
    }
    return new Promise((resolve) => {
      recorder.onstop = () => {
        sessionStreamRef.current?.getTracks().forEach((t) => t.stop());
        sessionStreamRef.current = null;
        sessionRecorderRef.current = null;
        const chunks = sessionChunksRef.current;
        sessionChunksRef.current = [];
        if (!chunks.length) {
          resolve(null);
          return;
        }
        resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      };
      recorder.stop();
    });
  }

  function stopSpeaking() {
    stopBrowserSpeech();
    setVoiceState((s) => (s === "speaking" ? "idle" : s));
  }

  async function speak(text: string) {
    if (mutedRef.current) {
      setVoiceState("idle");
      return;
    }
    setVoiceState("speaking");
    try {
      await speakInBrowser(text);
    } finally {
      setVoiceState((s) => (s === "speaking" ? "idle" : s));
    }
  }

  async function repeatQuestion() {
    if (!currentQuestion || voiceState === "recording") return;
    stopSpeaking();
    await speak(currentQuestion);
  }

  async function toggleRecording() {
    if (voiceState === "recording") {
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (!recorder) return;
      setVoiceState("transcribing");
      try {
        const text = await recorder.stop();
        if (!text) throw new Error("No speech detected. Please try again.");
        const updated: ChatMessage[] = [...messages, { role: "user", content: text }];
        setMessages(updated);

        const asked = updated.filter((m) => m.role === "assistant").length;
        if (asked >= INTERVIEW_QUESTION_LIMIT) {
          void finalizeInterview(updated);
          return;
        }
        void fetchNext(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transcription failed.");
      } finally {
        setVoiceState((s) => (s === "transcribing" ? "idle" : s));
      }
      return;
    }

    stopSpeaking();
    setError(null);
    try {
      const recorder = new BrowserSpeechRecognizer();
      await recorder.start();
      recorderRef.current = recorder;
      setVoiceState("recording");
    } catch {
      setError("Microphone access is required for the voice interview.");
    }
  }

  async function fetchNext(history: ChatMessage[]) {
    setThinking(true);
    setError(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setup: {
            applicationId,
            candidateName,
            jobTitle,
            jobDescription,
            resumeText,
          },
          messages: history,
          convId: applicationId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Interview failed.");
      const updated: ChatMessage[] = [...history, { role: "assistant", content: data.message }];
      setMessages(updated);
      setThinking(false);
      void speak(data.message).then(() => {
        if (data.done) void finalizeInterview(updated);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setThinking(false);
    }
  }

  async function finalizeInterview(history: ChatMessage[]) {
    setPhase("evaluating");
    setSaveStage("transcript");
    setError(null);
    try {
      const audioBlob = await stopSessionRecording();
      let recordingUrl: string | undefined;
      if (audioBlob && audioBlob.size > 0) {
        try {
          const form = new FormData();
          form.set("applicationId", applicationId);
          form.set("audio", audioBlob, "interview.webm");
          const up = await fetch("/api/interview/recording", {
            method: "POST",
            body: form,
          });
          const upData = await up.json();
          if (up.ok && upData.recordingUrl) recordingUrl = upData.recordingUrl;
        } catch {
          // keep going
        }
      }

      const saveRes = await fetch("/api/interview/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          messages: history,
          transcriptOnly: true,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Failed to save transcript.");

      setSaveStage("evaluate");
      const evalRes = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setup: {
            applicationId,
            candidateName,
            jobTitle,
            jobDescription,
            resumeText,
          },
          messages: history,
        }),
      });
      const evalData = await evalRes.json();
      if (!evalRes.ok) throw new Error(evalData.error || "Evaluation failed.");
      setEvaluation(evalData);

      setSaveStage("score");
      const fullSaveRes = await fetch("/api/interview/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          messages: history,
          evaluation: evalData,
          recordingUrl,
        }),
      });
      const fullSaveData = await fullSaveRes.json();
      if (!fullSaveRes.ok) throw new Error(fullSaveData.error || "Failed to save score.");

      await fetch("/api/interview/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: applicationId }),
      }).catch(() => {});

      setPhase("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save interview.");
      setPhase("interview");
    }
  }

  function acceptCall() {
    setPhase("interview");
    setMessages([]);
    void startSessionRecording();
    void fetchNext([]);
  }

  function leaveMeeting() {
    if (
      phase === "interview" &&
      messages.some((m) => m.role === "user") &&
      !window.confirm("Leave and submit your interview so far?")
    ) {
      return;
    }
    if (phase === "interview" && messages.some((m) => m.role === "user")) {
      void finalizeInterview(messages);
      return;
    }
    stopSpeaking();
    sessionRecorderRef.current?.stop();
    sessionStreamRef.current?.getTracks().forEach((t) => t.stop());
    window.location.href = "/careers";
  }

  const panelState =
    voiceState === "speaking"
      ? "speaking"
      : voiceState === "recording"
        ? "listening"
        : thinking || voiceState === "transcribing"
          ? "thinking"
          : "idle";

  const inMeeting = phase === "interview" || phase === "evaluating";

  return (
    <div className={inMeeting ? "" : "mx-auto max-w-5xl px-4 py-8 sm:px-6"}>
      {(error || invalidLink) && !inMeeting && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error || "Invalid interview link. Please apply again from the careers page."}
        </div>
      )}

      {phase === "loading" && (
        <div className="flex flex-col items-center py-20 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
          <p className="mt-3 text-sm">Joining meeting…</p>
        </div>
      )}

      {phase === "incoming" && (
        <div className="mx-auto flex max-w-md flex-col items-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 px-8 py-10 text-center text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
              AI Interview Meeting
            </p>
            <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold shadow-lg ring-4 ring-emerald-400/30">
              AI
            </div>
            <h1 className="mt-5 text-2xl font-bold">
              {jobTitle || "Screening interview"}
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Hosted for {candidateName || "you"}
            </p>
            <p className="mt-4 text-xs text-slate-400">
              Camera and microphone required · ~{INTERVIEW_QUESTION_LIMIT} questions
            </p>
          </div>
          <div className="w-full space-y-3 px-6 py-6">
            <button
              type="button"
              onClick={acceptCall}
              disabled={invalidLink}
              className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:bg-slate-300"
            >
              Join meeting
            </button>
            <Link
              href="/careers"
              className="block w-full rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </div>
      )}

      {inMeeting && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#1f1f1f] text-white">
          {/* Top bar */}
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#1f1f1f]/95 px-3 py-2.5 sm:px-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded bg-rose-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  Rec
                </span>
                <h1 className="truncate text-sm font-semibold sm:text-base">
                  {jobTitle || "AI Interview"}
                </h1>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">
                {formatRecordingTime(meetingSeconds)} · Question{" "}
                {questionsAsked === 0 ? "—" : questionIndex}/{INTERVIEW_QUESTION_LIMIT} ·{" "}
                {candidateName || "Candidate"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setPanelOpen((v) => !v)}
                className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium hover:bg-white/15"
              >
                {panelOpen ? "Hide Q" : "Show Q"}
              </button>
              <span className="hidden rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-slate-300 sm:inline">
                2 participants
              </span>
            </div>
          </header>

          {error && (
            <div className="shrink-0 border-b border-rose-500/30 bg-rose-950/80 px-4 py-2 text-center text-xs text-rose-100">
              {error}
            </div>
          )}

          {/* Stage */}
          <div className="relative min-h-0 flex-1">
            <div
              className={`flex h-full gap-3 p-3 sm:p-4 ${
                panelOpen ? "lg:pr-[min(340px,32%)]" : ""
              }`}
            >
              <div className="relative min-h-0 flex-1">
                <AiMeetingTile
                  state={
                    phase === "evaluating"
                      ? "thinking"
                      : (panelState as "idle" | "speaking" | "listening" | "thinking")
                  }
                  label={
                    phase === "evaluating"
                      ? saveStage === "transcript"
                        ? "Saving transcript…"
                        : saveStage === "evaluate"
                          ? "Evaluating answers…"
                          : "Saving score…"
                      : undefined
                  }
                />

                {/* Caption strip (current question) — mobile / when panel closed */}
                {!panelOpen && currentQuestion && phase === "interview" && (
                  <div className="absolute bottom-4 left-1/2 z-10 w-[min(92%,36rem)] -translate-x-1/2 rounded-xl bg-black/70 px-4 py-3 text-center text-sm leading-relaxed text-white backdrop-blur-md">
                    {currentQuestion}
                  </div>
                )}

                {/* Self-view PiP */}
                <div className="absolute bottom-3 right-3 z-20 sm:bottom-4 sm:right-4">
                  <CandidateCameraPreview
                    enabled={phase === "interview" || phase === "evaluating"}
                    muted={muted}
                    videoOn={videoOn}
                    pip
                  />
                </div>
              </div>
            </div>

            {/* Question / chat side panel */}
            {panelOpen && (
              <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-full flex-col border-l border-white/10 bg-[#252525] sm:max-w-sm lg:max-w-[320px]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <p className="text-sm font-semibold">Current question</p>
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    Question {questionsAsked === 0 ? "—" : questionIndex} of{" "}
                    {INTERVIEW_QUESTION_LIMIT}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-100">
                    {phase === "evaluating"
                      ? "Wrapping up your interview…"
                      : currentQuestion ||
                        (thinking
                          ? "Preparing your first question…"
                          : "Waiting for the interviewer…")}
                  </p>
                  {voiceState === "recording" && (
                    <p className="mt-4 rounded-lg bg-rose-600/20 px-3 py-2 text-xs font-medium text-rose-200">
                      Recording answer · {formatRecordingTime(recordSeconds)}
                    </p>
                  )}
                  {voiceState === "transcribing" && (
                    <p className="mt-4 text-xs text-slate-400">Transcribing your answer…</p>
                  )}

                  {messages.filter((m) => m.role === "user").length > 0 && (
                    <div className="mt-6 border-t border-white/10 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Your recent answers
                      </p>
                      <ul className="mt-2 space-y-2">
                        {messages
                          .filter((m) => m.role === "user")
                          .slice(-3)
                          .map((m, i) => (
                            <li
                              key={i}
                              className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300"
                            >
                              {m.content.slice(0, 160)}
                              {m.content.length > 160 ? "…" : ""}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>

          {/* Bottom Zoom-style controls */}
          <footer className="shrink-0 border-t border-white/10 bg-[#1a1a1a] px-2 py-3 sm:px-4 sm:py-4">
            {phase === "interview" ? (
              <div className="mx-auto flex max-w-3xl flex-wrap items-end justify-center gap-3 sm:gap-5">
                <ZoomControl
                  label={muted ? "Unmute" : "Mute"}
                  active={muted}
                  onClick={() => {
                    const next = !muted;
                    setMuted(next);
                    if (next) stopSpeaking();
                  }}
                >
                  <IconMute off={muted} />
                </ZoomControl>
                <ZoomControl
                  label={videoOn ? "Stop video" : "Start video"}
                  active={!videoOn}
                  onClick={() => setVideoOn((v) => !v)}
                >
                  <IconVideo off={!videoOn} />
                </ZoomControl>
                <ZoomControl
                  label="Repeat"
                  disabled={!currentQuestion || voiceState === "recording" || thinking}
                  onClick={() => void repeatQuestion()}
                >
                  <IconRepeat />
                </ZoomControl>
                <ZoomControl
                  label={
                    voiceState === "recording"
                      ? "Submit"
                      : voiceState === "transcribing"
                        ? "…"
                        : "Answer"
                  }
                  primary={voiceState !== "recording"}
                  danger={voiceState === "recording"}
                  disabled={
                    thinking || voiceState === "transcribing" || voiceState === "speaking"
                  }
                  onClick={() => void toggleRecording()}
                >
                  {voiceState === "recording" ? <IconStop /> : <IconMic />}
                </ZoomControl>
                <ZoomControl
                  label="Support"
                  active={supportOpen}
                  onClick={() => setSupportOpen((v) => !v)}
                >
                  <IconHelp />
                </ZoomControl>
                <ZoomControl label="Leave" danger onClick={leaveMeeting}>
                  <IconLeave />
                </ZoomControl>
              </div>
            ) : (
              <p className="py-2 text-center text-sm text-slate-300">
                Meeting ending — saving your interview report…
              </p>
            )}

            {supportOpen && phase === "interview" && (
              <div className="mx-auto mt-3 max-w-md rounded-lg border border-white/10 bg-[#2a2a2a] p-3 text-center text-xs text-slate-300">
                Need help? Refresh and re-check camera/mic permissions. Contact recruiting if
                the meeting won&apos;t connect.
              </div>
            )}
          </footer>
        </div>
      )}

      {phase === "complete" && (
        <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            {alreadyDone && !evaluation ? "Interview already completed" : "Meeting ended"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Thank you{candidateName ? `, ${candidateName}` : ""}. Your responses were evaluated
            and the report was sent to the recruiting team.
          </p>
          {evaluation && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-white p-4 text-left">
              <p className="text-sm text-slate-500">Screening score</p>
              <p className="text-3xl font-bold text-emerald-600">
                {evaluation.overallScore}/100
              </p>
              <p className="mt-2 text-sm text-slate-600">{evaluation.recommendationReason}</p>
            </div>
          )}
          <Link
            href="/careers"
            className="mt-6 inline-block text-sm font-semibold text-emerald-700 hover:underline"
          >
            ← Back to careers
          </Link>
        </div>
      )}
    </div>
  );
}

function IconMute({ off }: { off: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      {off ? (
        <>
          <path
            d="M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M5 5l14 14M19 11a7 7 0 01-1.5 4.3M5 11a7 7 0 0011.5 5.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M5 11a7 7 0 0014 0M12 18v3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

function IconVideo({ off }: { off: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="7"
        width="12"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M15 10l5-2.5v9L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      {off && (
        <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}

function IconMic() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 11a7 7 0 0014 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconStop() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function IconRepeat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.5 9a2.5 2.5 0 014.4 1.6c0 1.5-1.5 2-2 2.4M12 17h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconLeave() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
