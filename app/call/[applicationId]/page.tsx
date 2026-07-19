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
  AiVoicePanel,
  CandidateCameraPreview,
  formatRecordingTime,
} from "@/app/_components/InterviewRoomVoice";
import type { ChatMessage, InterviewEvaluation } from "@/lib/types";

type Phase = "loading" | "incoming" | "interview" | "evaluating" | "complete";
type VoiceState = "idle" | "speaking" | "recording" | "transcribing";
type SaveStage = "transcript" | "evaluate" | "score";

/**
 * AI Interview Room — voice interface (no avatar).
 * Layout: AI voice panel | current question | candidate camera + controls.
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
  const [recordSeconds, setRecordSeconds] = useState(0);
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

  const panelState =
    voiceState === "speaking"
      ? "speaking"
      : voiceState === "recording"
        ? "listening"
        : thinking || voiceState === "transcribing"
          ? "thinking"
          : "idle";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {(error || invalidLink) && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error || "Invalid interview link. Please apply again from the careers page."}
        </div>
      )}

      {phase === "loading" && (
        <div className="flex flex-col items-center py-20 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          <p className="mt-3 text-sm">Opening Interview Room…</p>
        </div>
      )}

      {phase === "incoming" && (
        <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
          <p className="text-sm font-medium text-indigo-600">AI Interview Room</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {candidateName || "Candidate"}
          </h1>
          <p className="text-slate-500">{jobTitle || "Screening interview"}</p>
          <p className="mt-4 max-w-sm text-center text-sm text-slate-600">
            Voice-based AI interview — no avatar. Allow camera and microphone when prompted.
            Answers are evaluated and a report is sent to the recruiter.
          </p>
          <button
            type="button"
            onClick={acceptCall}
            disabled={invalidLink}
            className="mt-8 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-slate-300"
          >
            Enter Interview Room
          </button>
        </div>
      )}

      {(phase === "interview" || phase === "evaluating") && (
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-white shadow-xl">
          <header className="border-b border-white/10 px-5 py-3">
            <h1 className="text-sm font-semibold tracking-wide sm:text-base">
              AI Interview – {jobTitle || "Open Role"}
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">
              Voice interface · report goes to Recruiter Admin
            </p>
          </header>

          <div className="grid gap-4 p-4 md:grid-cols-2 md:p-5">
            <AiVoicePanel
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

            <div className="flex min-h-[200px] flex-col rounded-xl border border-white/15 bg-slate-900/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Question {questionsAsked === 0 ? "—" : questionIndex} of{" "}
                {INTERVIEW_QUESTION_LIMIT}
              </p>
              <p className="mt-4 flex-1 text-lg font-medium leading-relaxed text-white">
                {phase === "evaluating"
                  ? "Wrapping up your interview…"
                  : currentQuestion ||
                    (thinking ? "Preparing your first question…" : "Waiting for AI…")}
              </p>
              {voiceState === "transcribing" && (
                <p className="mt-3 text-xs text-slate-400">Transcribing your answer…</p>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-900/80 px-4 py-5 sm:px-5">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between">
              <CandidateCameraPreview
                enabled={phase === "interview"}
                muted={muted}
              />
              <div className="text-center sm:text-right">
                <p className="text-sm font-medium text-rose-300">
                  {voiceState === "recording"
                    ? `Recording: ${formatRecordingTime(recordSeconds)}`
                    : phase === "evaluating"
                      ? "Processing…"
                      : "Ready to record"}
                </p>
              </div>
            </div>

            {phase === "interview" && (
              <div className="mt-5 flex flex-wrap justify-center gap-2 sm:gap-3">
                <ControlButton
                  onClick={() => {
                    const next = !muted;
                    setMuted(next);
                    if (next) stopSpeaking();
                  }}
                  active={muted}
                >
                  {muted ? "Unmute" : "Mute"}
                </ControlButton>
                <ControlButton
                  onClick={() => void repeatQuestion()}
                  disabled={!currentQuestion || voiceState === "recording" || thinking}
                >
                  Repeat Question
                </ControlButton>
                <ControlButton
                  onClick={() => void toggleRecording()}
                  disabled={thinking || voiceState === "transcribing" || voiceState === "speaking"}
                  primary={voiceState !== "recording"}
                  danger={voiceState === "recording"}
                >
                  {voiceState === "recording" ? "Submit Answer" : "Start Answer"}
                </ControlButton>
                <ControlButton onClick={() => setSupportOpen((v) => !v)}>
                  Support
                </ControlButton>
              </div>
            )}

            {supportOpen && (
              <div className="mx-auto mt-4 max-w-md rounded-lg border border-white/10 bg-slate-950/80 p-3 text-center text-xs text-slate-300">
                Need help? Email{" "}
                <a
                  href="mailto:careers@horizontalent.example"
                  className="text-indigo-300 underline"
                >
                  careers@horizontalent.example
                </a>
                . Technical issues: refresh the page and re-check camera/mic permissions.
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "complete" && (
        <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white">
            ✓
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            {alreadyDone && !evaluation ? "Interview already completed" : "Interview complete"}
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
            className="mt-6 inline-block text-sm font-semibold text-indigo-600 hover:underline"
          >
            ← Back to careers
          </Link>
        </div>
      )}
    </div>
  );
}

function ControlButton({
  children,
  onClick,
  disabled,
  primary,
  danger,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "border-rose-400 bg-rose-600 text-white hover:bg-rose-500"
          : primary
            ? "border-indigo-400 bg-indigo-600 text-white hover:bg-indigo-500"
            : active
              ? "border-amber-400 bg-amber-500/20 text-amber-100"
              : "border-white/25 bg-white/5 text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
