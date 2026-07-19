"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { DbJob } from "@/lib/types";

type CareerApplyFormProps = {
  job: DbJob;
  onSuccess?: () => void;
};

export function CareerApplyForm({ job, onSuccess }: CareerApplyFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    message: string;
    applicationId: string;
    confirmationEmail: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!resume) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.set("jobId", job.id);
      form.set("name", name);
      form.set("email", email);
      form.set("resume", resume);
      const res = await fetch("/api/apply", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Application failed.");
      setSuccess({
        message: data.message,
        applicationId: data.applicationId,
        confirmationEmail: data.confirmationEmail?.to || email,
      });
      setName("");
      setEmail("");
      setResume(null);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6">
        <p className="text-sm font-semibold text-emerald-900">Application submitted</p>
        <p className="mt-2 text-sm text-emerald-800">{success.message}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-emerald-900">
          <li>
            Confirmation email queued for{" "}
            <span className="font-medium">{success.confirmationEmail}</span>
          </li>
          <li>
            Application ID:{" "}
            <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">
              {success.applicationId}
            </code>
          </li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/careers/track?id=${encodeURIComponent(success.applicationId)}`}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Track application status
          </Link>
          <Link
            href={`/call/${success.applicationId}`}
            className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-50"
          >
            Start AI voice screening
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-900">Full name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-900">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <p className="mt-1 text-xs text-slate-500">
          We’ll send a confirmation email to this address.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-900">
          Resume <span className="font-normal text-slate-500">(PDF only)</span>
        </label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-1 flex w-full flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
        >
          <p className="text-sm text-slate-700">
            {resume ? resume.name : "Click to upload your PDF resume"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Max PDF · required to apply</p>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => setResume(e.target.files?.[0] ?? null)}
        />
      </div>
      <button
        type="submit"
        disabled={!resume || submitting}
        className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitting ? "Submitting…" : `Apply for ${job.title}`}
      </button>
    </form>
  );
}
