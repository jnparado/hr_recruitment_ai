"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MicRecorder } from "@/lib/audio";
import type { ChatMessage, InterviewEvaluation, InterviewSetup } from "@/lib/types";

type Phase = "setup" | "chat" | "evaluating" | "report";
type VoiceState = "idle" | "speaking" | "recording" | "transcribing";

const recStyles: Record<InterviewEvaluation["recommendation"], { label: string; className: string }> = {
  advance: { label: "Advance to next round", className: "bg-emerald-100 text-emerald-800" },
  maybe: { label: "Maybe — needs review", className: "bg-amber-100 text-amber-800" },
  reject: { label: "Do not advance", className: "bg-rose-100 text-rose-800" },
};

function scoreColor(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-rose-500";
}

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-500">Loading…</div>
      }
    >
      <InterviewContent />
    </Suspense>
  );
}

function InterviewContent() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("setup");
  const [setup, setSetup] = useState<InterviewSetup>({
    candidateName: searchParams.get("candidate") || "",
    jobTitle: searchParams.get("job") || "",
    jobDescription: "",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [voiceMode, setVoiceMode] = useState(true);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MicRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, voiceState]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setVoiceState((s) => (s === "speaking" ? "idle" : s));
  }

  async function speak(text: string) {
    if (!voiceMode) return;
    try {
      setVoiceState("speaking");
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Text-to-speech failed.");
      }
      const url = URL.createObjectURL(await res.blob());
      await new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => resolve();
        audio.onpause = () => resolve();
        audio.onerror = () => resolve();
        void audio.play().catch(() => resolve());
      });
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Text-to-speech failed.");
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
        if (!data.text) {
          setError("No speech detected — try recording again or type your answer.");
          return;
        }
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
      setError("Microphone access was denied. Allow mic access or type your answer instead.");
    }
  }

  async function fetchNext(history: ChatMessage[]): Promise<void> {
    setThinking(true);
    setError(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup, messages: history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Interview request failed.");
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
    setError(null);
    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup, messages: history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed.");
      setEvaluation(data);
      setPhase("report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed.");
      setPhase("chat");
    }
  }

  function startInterview() {
    setPhase("chat");
    setMessages([]);
    void fetchNext([]);
  }

  function sendAnswer() {
    const text = input.trim();
    if (!text || thinking) return;
    stopSpeaking();
    setInput("");
    const updated: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(updated);
    void fetchNext(updated);
  }

  function reset() {
    stopSpeaking();
    setPhase("setup");
    setMessages([]);
    setEvaluation(null);
    setError(null);
    setVoiceState("idle");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Interview Assistant</h1>
      <p className="mt-2 text-slate-600">
        Grok runs the first screening interview by voice or text — experience,
        skills, salary expectations, and availability — then scores the candidate
        with a hire recommendation.
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {phase === "setup" && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900">Candidate name</label>
              <input
                value={setup.candidateName}
                onChange={(e) => setSetup({ ...setup, candidateName: e.target.value })}
                placeholder="e.g. Maria Santos"
                className="mt-2 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900">
                Job title <span className="text-rose-500">*</span>
              </label>
              <input
                value={setup.jobTitle}
                onChange={(e) => setSetup({ ...setup, jobTitle: e.target.value })}
                placeholder="e.g. Senior Frontend Engineer"
                className="mt-2 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-900">
              Job description <span className="font-normal text-slate-500">(optional, improves questions)</span>
            </label>
            <textarea
              value={setup.jobDescription}
              onChange={(e) => setSetup({ ...setup, jobDescription: e.target.value })}
              rows={6}
              placeholder="Paste the job description so Grok can tailor its questions…"
              className="mt-2 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={voiceMode}
              onChange={(e) => setVoiceMode(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-indigo-600"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                Voice interview
              </span>
              <span className="block text-xs text-slate-500">
                Grok speaks each question aloud and the candidate answers by voice
                (requires microphone). You can still type answers at any time.
              </span>
            </span>
          </label>
          <button
            onClick={startInterview}
            disabled={!setup.jobTitle.trim()}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {voiceMode ? "Start voice interview" : "Start interview"}
          </button>
        </div>
      )}

      {(phase === "chat" || phase === "evaluating") && (
        <div className="mt-8 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <div className="text-sm">
              <span className="font-semibold text-slate-900">{setup.jobTitle}</span>
              {setup.candidateName && (
                <span className="text-slate-500"> · {setup.candidateName}</span>
              )}
            </div>
            {phase === "chat" && messages.length >= 4 && (
              <button
                onClick={() => evaluate(messages)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                End & evaluate now
              </button>
            )}
          </div>

          <div className="flex max-h-[55vh] min-h-[320px] flex-col gap-3 overflow-y-auto p-5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  m.role === "assistant"
                    ? "self-start rounded-bl-sm bg-slate-100 text-slate-800"
                    : "self-end rounded-br-sm bg-indigo-600 text-white"
                }`}
              >
                {m.content}
              </div>
            ))}
            {thinking && (
              <div className="self-start rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
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
            {voiceState === "speaking" && (
              <button
                onClick={stopSpeaking}
                className="flex items-center gap-2 self-start rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
                </span>
                Grok is speaking — click to skip
              </button>
            )}
            {voiceState === "transcribing" && (
              <div className="flex items-center gap-2 self-end rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                Transcribing your answer…
              </div>
            )}
            {phase === "evaluating" && (
              <div className="self-center py-4 text-sm text-slate-500">
                Interview complete — Grok is scoring the candidate…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {phase === "chat" && (
            <div className="flex gap-2 border-t border-slate-200 p-4">
              {voiceMode && (
                <button
                  onClick={toggleRecording}
                  disabled={thinking || voiceState === "transcribing"}
                  title={voiceState === "recording" ? "Stop recording" : "Record your answer"}
                  className={`flex h-[54px] w-[54px] shrink-0 items-center justify-center self-end rounded-xl text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
                    voiceState === "recording"
                      ? "animate-pulse bg-rose-600 hover:bg-rose-500"
                      : "bg-slate-900 hover:bg-slate-700"
                  }`}
                >
                  {voiceState === "recording" ? (
                    <span className="h-3.5 w-3.5 rounded-sm bg-white" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
                      <path d="M18 11a1 1 0 1 0-2 0 4 4 0 0 1-8 0 1 1 0 1 0-2 0 6 6 0 0 0 5 5.92V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.08A6 6 0 0 0 18 11z" />
                    </svg>
                  )}
                </button>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendAnswer();
                  }
                }}
                rows={2}
                placeholder={
                  voiceState === "recording"
                    ? "Recording… click the stop button when you finish speaking"
                    : voiceMode
                      ? "Speak with the mic button, or type the answer… (Enter to send)"
                      : "Type the candidate's answer… (Enter to send)"
                }
                className="flex-1 resize-none rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                onClick={sendAnswer}
                disabled={thinking || !input.trim() || voiceState === "recording"}
                className="self-end rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "report" && evaluation && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {setup.candidateName || "Candidate"} — {setup.jobTitle}
                </h2>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${recStyles[evaluation.recommendation]?.className ?? "bg-slate-100 text-slate-700"}`}
                >
                  {recStyles[evaluation.recommendation]?.label ?? evaluation.recommendation}
                </span>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-slate-900">
                  {evaluation.overallScore}
                  <span className="text-lg font-medium text-slate-400">/100</span>
                </div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400">
                  overall score
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              {evaluation.recommendationReason}
            </p>

            <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {(
                [
                  ["Experience", evaluation.scores.experience],
                  ["Skills", evaluation.scores.skills],
                  ["Communication", evaluation.scores.communication],
                  ["Role fit", evaluation.scores.roleFit],
                ] as const
              ).map(([label, score]) => (
                <div key={label}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className="font-semibold text-slate-900">{score}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${scoreColor(score)}`}
                      style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Salary expectation
              </h3>
              <p className="mt-1.5 text-sm font-medium text-slate-900">
                {evaluation.salaryExpectation}
              </p>
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Availability
              </h3>
              <p className="mt-1.5 text-sm font-medium text-slate-900">
                {evaluation.availability}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Key highlights
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {evaluation.keyHighlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {h}
                  </li>
                ))}
              </ul>
              {evaluation.concerns.length > 0 && (
                <>
                  <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Concerns
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                    {evaluation.concerns.map((c) => (
                      <li key={c} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Full transcript
            </h3>
            <div className="mt-3 space-y-3 text-sm leading-6">
              {messages.map((m, i) => (
                <p key={i}>
                  <span className="font-semibold text-slate-900">
                    {m.role === "assistant" ? "Interviewer" : setup.candidateName || "Candidate"}:
                  </span>{" "}
                  <span className="text-slate-700">{m.content}</span>
                </p>
              ))}
            </div>
          </div>

          <button
            onClick={reset}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Start another interview
          </button>
        </div>
      )}
    </div>
  );
}
