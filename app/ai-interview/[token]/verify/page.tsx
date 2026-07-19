"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

/** Required gate before Interview Room: name + email must match the invite. */
export default function VerifyCandidatePage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params.token || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(`/api/ai-interview/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", name, email }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Verification failed.");

      const start = await fetch(`/api/ai-interview/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const startData = await start.json();
      if (!start.ok) throw new Error(startData.error || "Could not start interview.");

      router.push(`/ai-interview/${token}/room`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
        Step 4 of 4 · Required
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Confirm it’s you</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter the same name and email from your invitation before entering the Interview Room.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-900">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-900">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
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
          disabled={submitting}
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-slate-300"
        >
          {submitting ? "Verifying…" : "Enter Interview Room"}
        </button>
      </form>
    </div>
  );
}
