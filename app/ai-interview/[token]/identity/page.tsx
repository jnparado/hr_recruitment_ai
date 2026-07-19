"use client";

import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";

/**
 * Optional identity verification — confirms the invited candidate is present.
 * Does NOT use appearance for hiring decisions.
 */
export default function IdentityPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params.token || "");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selfieTaken, setSelfieTaken] = useState(false);
  const [fullName, setFullName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enableCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      setError("Could not access camera for selfie (optional). You can skip identity steps.");
    }
  }

  function captureSelfie() {
    setSelfieTaken(true);
  }

  function sendCode() {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentCode(code);
    console.info("[ai-interview] demo email verification code:", code);
  }

  async function continueNext(skip = false) {
    setSubmitting(true);
    setError(null);
    try {
      if (!skip && sentCode && emailCode && emailCode !== sentCode) {
        throw new Error("Email verification code does not match.");
      }
      const r = await fetch(`/api/ai-interview/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "identity" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not continue.");
      stream?.getTracks().forEach((t) => t.stop());
      router.push(`/ai-interview/${token}/verify`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
        Step 3 of 4 · Optional
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Identity verification</h1>
      <p className="mt-2 text-sm text-slate-600">
        These checks only confirm that the invited candidate is present. AI will not use facial
        appearance, accent, age, gender, disability, or other protected characteristics to make
        hiring decisions.
      </p>

      <section className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Candidate selfie</h2>
        {!stream ? (
          <button
            type="button"
            onClick={() => void enableCamera()}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Enable camera
          </button>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="aspect-video w-full rounded-xl bg-slate-900 object-cover"
            />
            <button
              type="button"
              onClick={captureSelfie}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              {selfieTaken ? "Selfie captured ✓" : "Capture selfie"}
            </button>
          </>
        )}
      </section>

      <section className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Confirm details</h2>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
        />
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
        />
        <p className="text-xs text-slate-500">
          Birthdate is for identity confirmation only — never used for scoring.
        </p>
      </section>

      <section className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Email verification code</h2>
        <button
          type="button"
          onClick={sendCode}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Send code to invited email
        </button>
        {sentCode && (
          <p className="text-xs text-amber-700">
            Demo mode: code is <code className="font-mono">{sentCode}</code> (shown because email
            delivery is not configured).
          </p>
        )}
        <input
          value={emailCode}
          onChange={(e) => setEmailCode(e.target.value)}
          placeholder="6-digit code"
          className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
        />
      </section>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void continueNext(true)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Skip for now
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void continueNext(false)}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-slate-300"
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
