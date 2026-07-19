"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type CheckKey = "camera" | "microphone" | "speaker" | "internet" | "browser";

type CheckState = Record<CheckKey, "pending" | "ready" | "fail">;

const LABELS: Record<CheckKey, string> = {
  camera: "Camera",
  microphone: "Microphone",
  speaker: "Speaker",
  internet: "Internet",
  browser: "Browser",
};

export default function DeviceTestPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params.token || "");
  const [checks, setChecks] = useState<CheckState>({
    camera: "pending",
    microphone: "pending",
    speaker: "pending",
    internet: "pending",
    browser: "pending",
  });
  const [preview, setPreview] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const runChecks = useCallback(async () => {
    setError(null);
    const next: CheckState = {
      camera: "pending",
      microphone: "pending",
      speaker: "pending",
      internet: "pending",
      browser: "pending",
    };

    const ua = navigator.userAgent;
    const supported =
      typeof window !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      (window.RTCPeerConnection !== undefined || "webkitRTCPeerConnection" in window);
    next.browser = supported && !/MSIE|Trident/.test(ua) ? "ready" : "fail";

    next.internet = navigator.onLine ? "ready" : "fail";
    setChecks({ ...next });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPreview((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return stream;
      });
      next.camera = stream.getVideoTracks().some((t) => t.readyState === "live")
        ? "ready"
        : "fail";
      next.microphone = stream.getAudioTracks().some((t) => t.readyState === "live")
        ? "ready"
        : "fail";
    } catch {
      next.camera = "fail";
      next.microphone = "fail";
      setError("Allow camera and microphone access to continue.");
    }

    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        await ctx.resume();
        next.speaker = ctx.state === "running" ? "ready" : "fail";
        await ctx.close();
      } else {
        next.speaker = "fail";
      }
    } catch {
      next.speaker = "fail";
    }

    setChecks({ ...next });
  }, []);

  useEffect(() => {
    void runChecks();
    return () => {
      setPreview((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
    };
  }, [runChecks]);

  const allRequiredReady =
    checks.camera === "ready" &&
    checks.microphone === "ready" &&
    checks.speaker === "ready" &&
    checks.internet === "ready" &&
    checks.browser === "ready";

  async function continueNext() {
    if (!allRequiredReady) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(`/api/ai-interview/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "devices" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not continue.");
      preview?.getTracks().forEach((t) => t.stop());
      router.push(`/ai-interview/${token}/identity`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
        Step 2 of 4
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Device testing room</h1>
      <p className="mt-2 text-sm text-slate-600">
        All required devices must be ready before you can continue.
      </p>

      {preview && (
        <video
          autoPlay
          muted
          playsInline
          ref={(el) => {
            if (el && preview) el.srcObject = preview;
          }}
          className="mt-6 aspect-video w-full rounded-xl bg-slate-900 object-cover"
        />
      )}

      <ul className="mt-6 space-y-2">
        {(Object.keys(LABELS) as CheckKey[]).map((key) => (
          <li
            key={key}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <span className="font-medium text-slate-800">{LABELS[key]}</span>
            <StatusBadge state={checks[key]} />
          </li>
        ))}
      </ul>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void runChecks()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Re-check devices
        </button>
        <button
          type="button"
          disabled={!allRequiredReady || submitting}
          onClick={() => void continueNext()}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: "pending" | "ready" | "fail" }) {
  if (state === "ready") {
    return <span className="font-semibold text-emerald-700">Ready</span>;
  }
  if (state === "fail") {
    return <span className="font-semibold text-rose-700">Failed</span>;
  }
  return <span className="text-slate-400">Checking…</span>;
}
