"use client";

import { useEffect, useRef, useState } from "react";

type VoicePanelState = "idle" | "speaking" | "listening" | "thinking";

/** Voice-first AI panel — waveform instead of a costly avatar. */
export function AiVoicePanel({
  state,
  label,
}: {
  state: VoicePanelState;
  label?: string;
}) {
  const active = state === "speaking" || state === "listening";
  const bars = 12;

  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-white/15 bg-slate-900/80 p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
        AI Interviewer
      </p>
      <p className="mt-1 text-sm text-slate-400">Voice interface</p>

      <div className="mt-8 flex h-16 items-end justify-center gap-1.5">
        {Array.from({ length: bars }, (_, i) => (
          <span
            key={i}
            className={`w-1.5 rounded-full bg-indigo-400 ${
              active ? "animate-pulse" : "opacity-40"
            }`}
            style={{
              height: active
                ? `${20 + ((i * 17 + 11) % 40)}px`
                : "10px",
              animationDelay: active ? `${i * 80}ms` : undefined,
              animationDuration: state === "speaking" ? "0.6s" : "1.1s",
            }}
          />
        ))}
      </div>

      <p className="mt-6 text-sm font-medium text-white">
        {label ||
          (state === "speaking"
            ? "AI is speaking…"
            : state === "listening"
              ? "Listening to your answer…"
              : state === "thinking"
                ? "Preparing next question…"
                : "Ready")}
      </p>
    </div>
  );
}

export function CandidateCameraPreview({
  enabled,
  muted,
}: {
  enabled: boolean;
  muted: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let stream: MediaStream | null = null;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (!cancelled) setError("Camera unavailable");
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [enabled]);

  return (
    <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-lg border border-white/20 bg-slate-950">
      {enabled && !error ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-cover ${muted ? "opacity-60" : ""}`}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-slate-500">
          {error || "Camera off"}
        </div>
      )}
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
        Candidate Camera{muted ? " · muted" : ""}
      </span>
    </div>
  );
}

export function formatRecordingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
