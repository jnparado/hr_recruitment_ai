"use client";

import { useEffect, useRef, useState } from "react";

type VoicePanelState = "idle" | "speaking" | "listening" | "thinking";

/** Large Zoom-style participant tile for the AI interviewer. */
export function AiMeetingTile({
  state,
  label,
  name = "AI Interviewer",
}: {
  state: VoicePanelState;
  label?: string;
  name?: string;
}) {
  const active = state === "speaking" || state === "listening";
  const bars = 16;

  const status =
    label ||
    (state === "speaking"
      ? "Speaking…"
      : state === "listening"
        ? "Listening…"
        : state === "thinking"
          ? "Thinking…"
          : "Ready");

  return (
    <div className="relative flex h-full min-h-[280px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#1a1a1a] shadow-inner ring-1 ring-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(34,197,94,0.18), transparent 70%)",
        }}
      />

      {/* Speaking ring */}
      <div
        className={`relative flex h-36 w-36 items-center justify-center rounded-full sm:h-44 sm:w-44 ${
          active ? "ring-4 ring-emerald-400/80" : "ring-2 ring-white/15"
        }`}
      >
        <div className="flex h-[85%] w-[85%] items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 shadow-lg">
          <div className="flex h-14 items-end justify-center gap-1">
            {Array.from({ length: bars }, (_, i) => (
              <span
                key={i}
                className={`w-1 rounded-full bg-white/90 ${active ? "animate-pulse" : "opacity-50"}`}
                style={{
                  height: active ? `${12 + ((i * 13 + 7) % 28)}px` : "8px",
                  animationDelay: active ? `${i * 55}ms` : undefined,
                  animationDuration: state === "speaking" ? "0.55s" : "1s",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="relative mt-6 text-lg font-semibold text-white sm:text-xl">{name}</p>
      <p className="relative mt-1 text-sm text-emerald-300/90">{status}</p>

      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
        <span
          className={`h-2 w-2 rounded-full ${
            state === "speaking"
              ? "bg-emerald-400"
              : state === "listening"
                ? "bg-rose-400"
                : "bg-slate-400"
          }`}
        />
        {name}
      </div>
    </div>
  );
}

/** @deprecated Prefer AiMeetingTile in Zoom layout — kept for any legacy use. */
export function AiVoicePanel({
  state,
  label,
}: {
  state: VoicePanelState;
  label?: string;
}) {
  return <AiMeetingTile state={state} label={label} />;
}

export function CandidateCameraPreview({
  enabled,
  muted,
  videoOn = true,
  className = "",
  pip = false,
}: {
  enabled: boolean;
  muted: boolean;
  videoOn?: boolean;
  className?: string;
  /** Picture-in-picture style (Zoom self-view). */
  pip?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (!cancelled) setError("Camera unavailable");
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    streamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = videoOn;
    });
  }, [videoOn]);

  const shell = pip
    ? "aspect-video w-full max-w-[220px] sm:max-w-[260px] rounded-xl shadow-2xl ring-1 ring-white/20"
    : "aspect-video w-full max-w-xs rounded-lg border border-white/20";

  return (
    <div className={`relative overflow-hidden bg-[#0f0f0f] ${shell} ${className}`}>
      {enabled && !error && videoOn ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full scale-x-[-1] object-cover ${muted ? "opacity-70" : ""}`}
        />
      ) : (
        <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 bg-[#1c1c1c] text-slate-400">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-700 text-lg font-semibold text-white">
            You
          </span>
          <span className="text-xs">{error || (videoOn ? "Camera off" : "Video stopped")}</span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
        {muted && (
          <span className="flex h-4 w-4 items-center justify-center rounded bg-rose-600 text-[8px]">
            M
          </span>
        )}
        You{muted ? " · muted" : ""}
      </div>
    </div>
  );
}

export function formatRecordingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Circular Zoom-style meeting control. */
export function ZoomControl({
  label,
  onClick,
  disabled,
  active,
  danger,
  primary,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition sm:h-14 sm:w-14 ${
          danger
            ? "bg-rose-600 text-white hover:bg-rose-500"
            : primary
              ? "bg-emerald-500 text-white hover:bg-emerald-400"
              : active
                ? "bg-white text-slate-900 hover:bg-slate-200"
                : "bg-[#3c3c3c] text-white hover:bg-[#4a4a4a]"
        }`}
      >
        {children}
      </span>
      <span className="max-w-[4.5rem] truncate text-[10px] text-slate-300 sm:text-[11px]">
        {label}
      </span>
    </button>
  );
}
