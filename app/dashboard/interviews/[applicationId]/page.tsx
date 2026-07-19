"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { speakInBrowser, stopBrowserSpeech } from "@/lib/browser-voice";
import type { ChatMessage, InterviewEvaluation } from "@/lib/types";

type InterviewDetail = {
  applicationId: string;
  candidateName: string;
  email: string;
  jobTitle: string;
  status: string;
  resumeMatchScore: number | null;
  completedAt: string;
  overallScore: number;
  recommendation: string;
  evaluation: InterviewEvaluation;
  transcript: ChatMessage[];
  recordingUrl: string | null;
};

function scoreClass(score: number | null | undefined) {
  if (score == null) return "text-slate-400";
  if (score >= 70) return "text-emerald-600";
  if (score >= 45) return "text-amber-600";
  return "text-rose-600";
}

function recBadge(rec: string | null | undefined) {
  if (!rec) return "bg-slate-100 text-slate-600";
  if (rec === "advance") return "bg-emerald-100 text-emerald-800";
  if (rec === "maybe") return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

export default function InterviewListenPage() {
  const params = useParams();
  const applicationId = String(params.applicationId || "");

  const [data, setData] = useState<InterviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [activeTurn, setActiveTurn] = useState<number | null>(null);
  const stopRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!applicationId) return;
    fetch(`/api/dashboard/interviews/${applicationId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load interview.")
      )
      .finally(() => setLoading(false));

    return () => {
      stopRef.current = true;
      stopBrowserSpeech();
      audioRef.current?.pause();
    };
  }, [applicationId]);

  function stopPlayback() {
    stopRef.current = true;
    stopBrowserSpeech();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    setActiveTurn(null);
  }

  async function playAudioRecording() {
    if (!data?.recordingUrl) return;
    stopPlayback();
    stopRef.current = false;
    setPlaying(true);
    const audio = new Audio(data.recordingUrl);
    audioRef.current = audio;
    audio.onended = () => {
      setPlaying(false);
      setActiveTurn(null);
    };
    audio.onerror = () => {
      setPlaying(false);
      stopRef.current = false;
      setError("Could not play the audio recording. Playing transcript instead.");
      void playTranscript();
    };
    try {
      await audio.play();
    } catch {
      setPlaying(false);
      void playTranscript();
    }
  }

  async function playTranscript() {
    if (!data?.transcript?.length) return;
    stopBrowserSpeech();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    stopRef.current = false;
    setPlaying(true);

    for (let i = 0; i < data.transcript.length; i++) {
      if (stopRef.current) break;
      const turn = data.transcript[i];
      setActiveTurn(i);
      const label = turn.role === "assistant" ? "Interviewer" : "Candidate";
      await speakInBrowser(`${label}. ${turn.content}`);
    }

    if (!stopRef.current) {
      setPlaying(false);
      setActiveTurn(null);
    }
  }

  function startListening() {
    if (data?.recordingUrl) {
      void playAudioRecording();
    } else {
      void playTranscript();
    }
  }

  const evalData = data?.evaluation;
  const hasScores = !!evalData?.scores;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Interview recording
      </h1>
      <p className="mt-2 text-slate-600">
        Listen to the AI screening conversation and review scores for this candidate.
      </p>

      {loading && (
        <p className="mt-8 text-sm text-slate-500">Loading interview…</p>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {data && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {data.candidateName}
                </h2>
                <p className="text-sm text-slate-500">{data.email}</p>
                <p className="mt-1 text-sm text-slate-700">{data.jobTitle}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Completed {new Date(data.completedAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${scoreClass(data.overallScore)}`}>
                  {data.overallScore}
                  <span className="text-base font-medium text-slate-400">/100</span>
                </p>
                <span
                  className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${recBadge(data.recommendation)}`}
                >
                  {data.recommendation || "pending"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!playing ? (
                <button
                  type="button"
                  onClick={startListening}
                  disabled={!data.transcript.length && !data.recordingUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Listen to interview
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopPlayback}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M6 6h12v12H6z" />
                  </svg>
                  Stop
                </button>
              )}
              <p className="text-xs text-slate-500">
                {data.recordingUrl
                  ? "Playing saved audio recording"
                  : "Playing stored interview transcript aloud (question → answer)"}
              </p>
            </div>
          </div>

          {hasScores && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Score breakdown
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {(
                  [
                    ["Experience", evalData.scores.experience],
                    ["Skills", evalData.scores.skills],
                    ["Communication", evalData.scores.communication],
                    ["Role fit", evalData.scores.roleFit],
                  ] as const
                ).map(([label, score]) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className={`text-lg font-bold ${scoreClass(score)}`}>{score}</p>
                  </div>
                ))}
              </div>
              {evalData.recommendationReason && (
                <p className="mt-4 text-sm leading-6 text-slate-700">
                  {evalData.recommendationReason}
                </p>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    Highlights
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {(evalData.keyHighlights || []).map((h) => (
                      <li key={h}>• {h}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                    Concerns
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {(evalData.concerns || []).length ? (
                      evalData.concerns.map((c) => <li key={c}>• {c}</li>)
                    ) : (
                      <li className="text-slate-400">None flagged</li>
                    )}
                  </ul>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-800">Salary:</span>{" "}
                  {evalData.salaryExpectation || "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-800">Availability:</span>{" "}
                  {evalData.availability || "—"}
                </p>
                {data.resumeMatchScore != null && (
                  <p>
                    <span className="font-medium text-slate-800">Resume score:</span>{" "}
                    {data.resumeMatchScore}/100
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Full transcript
            </h3>
            <div className="mt-4 space-y-3">
              {data.transcript.length === 0 && (
                <p className="text-sm text-slate-400">No transcript saved.</p>
              )}
              {data.transcript.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                    activeTurn === i
                      ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100"
                      : m.role === "assistant"
                        ? "border-indigo-100 bg-indigo-50/60 text-slate-800"
                        : "border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {m.role === "assistant" ? "AI interviewer" : "Candidate"}
                  </p>
                  {m.content}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
