"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type InviteInfo = {
  jobTitle: string;
  companyName: string;
  durationMinutes: number;
  deadline: string;
  expired: boolean;
  usable: boolean;
  candidateEmailHint: string;
  error?: string;
};

/**
 * Interview Invitation Page — opened from the secure email link:
 * /ai-interview/[token]
 */
export default function AiInterviewInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params.token || "");
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/ai-interview/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setInfo(d);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Invalid link."))
      .finally(() => setLoading(false));
  }, [token]);

  async function start() {
    if (!consent || !info?.usable) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(`/api/ai-interview/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "consent" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not continue.");
      router.push(`/ai-interview/${token}/devices`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-slate-500">
        Loading interview invitation…
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Interview unavailable</h1>
        <p className="mt-2 text-sm text-rose-700">{error}</p>
        <p className="mt-2 text-sm text-slate-500">
          This secure link may be invalid, expired, or already used. Contact the recruiter for a
          new invitation email.
        </p>
        <Link href="/careers" className="mt-6 inline-block text-sm font-semibold text-indigo-700">
          ← Back to careers
        </Link>
      </div>
    );
  }

  const deadlineLabel = info
    ? new Date(info.deadline).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
        Secure invitation
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        AI Interview Room
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        You received this link by email. It is personal — do not forward it. The AI will conduct
        your first-stage interview, evaluate your answers, and send a report to the recruiter.
      </p>

      <div className="mt-8 space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Row label="Job title" value={info?.jobTitle || "—"} />
        <Row label="Company" value={info?.companyName || "—"} />
        <Row label="Expected duration" value={`About ${info?.durationMinutes ?? 30} minutes`} />
        <Row label="Interview deadline" value={deadlineLabel} />
        <Row label="Invited email" value={info?.candidateEmailHint || "—"} />
        <Row label="Required" value="Camera and microphone" />
      </div>

      <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-950">
        <p className="font-semibold">Before you start</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-indigo-900/90">
          <li>Find a quiet place with stable internet</li>
          <li>Allow camera and microphone when prompted</li>
          <li>Answer clearly — you can repeat a question anytime</li>
          <li>Link expires after the deadline and only works for you</li>
        </ul>
      </div>

      {!info?.usable && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {info?.expired
            ? "This interview link has expired. Ask the recruiter to email a new secure invitation."
            : "This interview link is no longer valid."}
        </div>
      )}

      {info?.usable && (
        <>
          <label className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <span>
              <strong className="font-semibold text-slate-900">Privacy & recording consent.</strong>{" "}
              I agree this AI interview may be recorded for evaluation. Transcripts and scores are
              shared only with the hiring team. AI does not make final hiring decisions from
              appearance, accent, age, gender, disability, or other protected characteristics.
            </span>
          </label>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={!consent || submitting}
            onClick={() => void start()}
            className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? "Starting…" : "Start Interview"}
          </button>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
