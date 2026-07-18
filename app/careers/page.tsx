"use client";

import { useEffect, useRef, useState } from "react";
import { CareerFlowDiagram } from "@/app/_components/CareerFlowDiagram";
import type { DbJob } from "@/lib/types";

export default function CareersPage() {
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<DbJob | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [voiceInterviewUrl, setVoiceInterviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .catch(() => setError("Could not load jobs."))
      .finally(() => setLoading(false));
  }, []);

  function openApply(job: DbJob) {
    setSelectedJob(job);
    setSuccess(null);
    setVoiceInterviewUrl(null);
    setError(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJob || !resume) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setVoiceInterviewUrl(null);
    try {
      const form = new FormData();
      form.set("jobId", selectedJob.id);
      form.set("name", name);
      form.set("email", email);
      form.set("resume", resume);
      const res = await fetch("/api/apply", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Application failed.");
      setSuccess(data.message);
      setVoiceInterviewUrl(data.voiceInterviewUrl ?? null);
      setName("");
      setEmail("");
      setResume(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="text-center">
        <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          We&apos;re hiring
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">Careers</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Apply in minutes. Upload your resume and our AI-powered pipeline handles parsing,
          job matching, scoring, and interview scheduling — orchestrated by n8n.
        </p>
      </section>

      <div className="mt-10">
        <CareerFlowDiagram />
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-slate-900">Open positions</h2>
        {loading && <p className="mt-4 text-sm text-slate-500">Loading jobs…</p>}
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{job.department}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{job.location}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{job.type}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{job.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600 line-clamp-4">
                {job.description}
              </p>
              <button
                onClick={() => openApply(job)}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Apply now
              </button>
            </article>
          ))}
        </div>
      </section>

      <section ref={formRef} className="mt-14">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            {selectedJob ? `Apply: ${selectedJob.title}` : "Apply for a role"}
          </h2>
          {!selectedJob && (
            <p className="mt-2 text-sm text-slate-500">Select a job above to start your application.</p>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p>{success}</p>
              {voiceInterviewUrl && (
                <a
                  href={voiceInterviewUrl}
                  className="mt-3 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  Start AI voice interview →
                </a>
              )}
            </div>
          )}

          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={!selectedJob}
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!selectedJob}
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900">
                Resume <span className="text-slate-500">(PDF only)</span>
              </label>
              <div
                onClick={() => selectedJob && inputRef.current?.click()}
                className="mt-1 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30 disabled:cursor-not-allowed"
              >
                <p className="text-sm text-slate-600">
                  {resume ? resume.name : "Click to upload PDF resume"}
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  disabled={!selectedJob}
                  onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!selectedJob || !resume || submitting}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </form>
          <p className="mt-3 text-center text-xs text-slate-400">
            Apply → AI calls you → Voice interview → Speech-to-text → Grok evaluates → Score →
            Recruiter dashboard
          </p>
        </div>
      </section>
    </div>
  );
}
