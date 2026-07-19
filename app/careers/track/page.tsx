"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";

type StatusResult = {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  statusLabel: string;
  appliedAt: string;
  confirmationNote: string;
};

function TrackForm() {
  const searchParams = useSearchParams();
  const [applicationId, setApplicationId] = useState(searchParams.get("id") || "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/careers/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not look up application.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-900">Application ID</label>
          <input
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            required
            placeholder="From your confirmation email"
            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-900">Email used to apply</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:bg-slate-300"
        >
          {loading ? "Looking up…" : "Check status"}
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Application status
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{result.statusLabel}</p>
          <dl className="mt-4 space-y-2 text-sm text-slate-700">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium">{result.candidateName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-medium text-right">{result.jobTitle}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Applied</dt>
              <dd className="font-medium">
                {new Date(result.appliedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-slate-600">{result.confirmationNote}</p>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Track your application
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Enter the application ID from your confirmation email and the email address you used
          when you applied.
        </p>
      </div>
      <div className="mt-8">
        <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading…</p>}>
          <TrackForm />
        </Suspense>
      </div>
      <p className="mt-8 text-center text-sm text-slate-500">
        Looking for a role?{" "}
        <Link href="/careers#open-roles" className="font-medium text-indigo-700 hover:underline">
          Browse open positions
        </Link>
      </p>
    </div>
  );
}
