"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MicRecorder } from "@/lib/audio";
import type { ChatMessage, InterviewEvaluation } from "@/lib/types";

type Phase = "loading" | "incoming" | "interview" | "evaluating" | "complete";
type VoiceState = "idle" | "speaking" | "recording" | "transcribing";

const FLOW = [
  "Candidate Applies",
  "AI Calls Candidate",
  "Voice Interview",
  "Speech to Text",
  "Grok AI",
  "Evaluate Answers",
  "Score",
  "Recruiter Dashboard",
];

export default function CallPage() {
  const params = useParams();
  const applicationId = String(params.applicationId || "");

  const [phase, setPhase] = useState<Phase>("loading");
  const [candidateName, setCandidateName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MicRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/applications/${applicationId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setCandidateName(d.candidateName);
        setJobTitle(d.jobTitle);
        setAlreadyDone(d.alreadyInterviewed);
        setPhase(d.alreadyInterviewed ? "complete" : "incoming");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load application.");
        setPhase("incoming");
      });
  }, [applicationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, voiceState, thinking]);

  useEffect(() => () => audioRef.current?.pause(), []);

  function stopSpeaking() {
    audioRef.current?.pause();
    audioRef.current = null;
    setVoiceState((s) => (s === "speaking" ? "idle" : s));
  }

  async function speak(text: string) {
    setVoiceState("speaking");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Text-to-speech failed.");
      const url = URL.createObjectURL(await res.blob());
      await new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        void audio.play().catch(() => resolve());
      });
      URL.revokeObjectURL(url);
    } finally {
      audioRef.current = null;
      setVoiceState((s) => (s === "speaking" ? "idle" : s));
    }
  }

  async function toggleRecording() {
    if (voiceState === "recording") {
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (!recorder) return;
      setVoiceState("transcribing");
      try {
        const wav = await recorder.stop();
        const form = new FormData();
        form.append("audio", new File([wav], "answer.wav", { type: "audio/wav" }));
        const res = await fetch("/api/stt", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Transcription failed.");
        if (!data.text) throw new Error("No speech detected. Please try again.");
        const updated: ChatMessage[] = [...messages, { role: "user", content: data.text }];
        setMessages(updated);
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
      const recorder = new MicRecorder();
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
          setup: { candidateName, jobTitle, jobDescription: "" },
          messages: history,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Interview failed.");
      const updated: ChatMessage[] = [...history, { role: "assistant", content: data.message }];
      setMessages(updated);
      setThinking(false);
      await speak(data.message);
      if (data.done) await evaluate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setThinking(false);
    }
  }

  async function evaluate(history: ChatMessage[]) {
    setPhase("evaluating");
    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setup: { candidateName, jobTitle, jobDescription: "" },
          messages: history,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed.");
      setEvaluation(data);

      await fetch("/api/interview/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, messages: history, evaluation: data }),
      });

      setPhase("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed.");
      setPhase("interview");
    }
  }

  function acceptCall() {
    setPhase("interview");
    setMessages([]);
    void fetchNext([]);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-center gap-1 text-[10px] text-slate-400">
        {FLOW.map((step, i) => (
          <span key={step} className="flex items-center gap-1">
            <span className={step === "AI Calls Candidate" ? "font-semibold text-indigo-600" : ""}>
              {step}
            </span>
            {i < FLOW.length - 1 && "→"}
          </span>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {phase === "loading" && (
        <div className="flex flex-col items-center py-20 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          <p className="mt-3 text-sm">Connecting…</p>
        </div>
      )}

      {phase === "incoming" && (
        <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-gradient-to-b from-indigo-50 to-white p-10 shadow-lg">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-indigo-600">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-40" />
            <svg viewBox="0 0 24 24" fill="white" className="h-10 w-10">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.24 1l-2.2 2.21z" />
            </svg>
          </div>
          <p className="mt-6 text-sm font-medium text-indigo-600">Incoming AI screening call</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{candidateName || "Candidate"}</h1>
          <p className="text-slate-500">{jobTitle || "Screening interview"}</p>
          <p className="mt-4 max-w-sm text-center text-sm text-slate-600">
            Our AI interviewer will ask about your experience, skills, salary expectations, and
            availability. Allow microphone access when prompted.
          </p>
          <button
            onClick={acceptCall}
            className="mt-8 rounded-full bg-emerald-500 px-10 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-400"
          >
            Accept call
          </button>
        </div>
      )}

      {(phase === "interview" || phase === "evaluating") && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3">
            <p className="text-sm font-semibold text-slate-900">Voice interview — {jobTitle}</p>
            <p className="text-xs text-slate-500">
              {phase === "evaluating"
                ? "Speech → Text → Grok AI → Scoring…"
                : "Speak your answers using the mic button"}
            </p>
          </div>
          <div className="flex max-h-[50vh] min-h-[280px] flex-col gap-3 overflow-y-auto p-5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "assistant"
                    ? "self-start rounded-bl-sm bg-slate-100 text-slate-800"
                    : "self-end rounded-br-sm bg-indigo-600 text-white"
                }`}
              >
                {m.content}
              </div>
            ))}
            {voiceState === "speaking" && (
              <p className="self-start text-xs text-indigo-600">AI is speaking…</p>
            )}
            {voiceState === "transcribing" && (
              <p className="self-end text-xs text-slate-500">Transcribing your answer…</p>
            )}
            {thinking && (
              <div className="self-start rounded-2xl bg-slate-100 px-4 py-3">
                <span className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {phase === "interview" && (
            <div className="flex justify-center border-t border-slate-200 p-5">
              <button
                onClick={toggleRecording}
                disabled={thinking || voiceState === "transcribing" || voiceState === "speaking"}
                className={`flex h-16 w-16 items-center justify-center rounded-full text-white transition ${
                  voiceState === "recording"
                    ? "animate-pulse bg-rose-500 hover:bg-rose-400"
                    : "bg-indigo-600 hover:bg-indigo-500"
                } disabled:bg-slate-300`}
              >
                {voiceState === "recording" ? (
                  <span className="h-5 w-5 rounded-sm bg-white" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                    <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
                    <path d="M18 11a1 1 0 1 0-2 0 4 4 0 0 1-8 0 1 1 0 1 0-2 0 6 6 0 0 0 5 5.92V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.08A6 6 0 0 0 18 11z" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "complete" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white">
            ✓
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            {alreadyDone && !evaluation ? "Interview already completed" : "Interview complete"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Thank you{candidateName ? `, ${candidateName}` : ""}. Your responses have been scored
            and sent to our recruiting team.
          </p>
          {evaluation && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-white p-4 text-left">
              <p className="text-sm text-slate-500">Your screening score</p>
              <p className="text-3xl font-bold text-emerald-600">{evaluation.overallScore}/100</p>
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
