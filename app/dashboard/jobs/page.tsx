"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DbJob } from "@/lib/types";

export default function JobPostsPage() {
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setJobs(d.jobs ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load jobs."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Job Posts</h1>
      <p className="mt-1 text-sm text-slate-600">
        Open roles shown on the public Career Website.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {loading && <p className="mt-6 text-sm text-slate-500">Loading jobs…</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {jobs.map((job) => (
          <article
            key={job.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold text-slate-900">{job.title}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {job.department} · {job.location} · {job.type}
            </p>
            <p className="mt-3 line-clamp-3 text-sm text-slate-600">{job.description}</p>
            <Link
              href="/careers"
              className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline"
            >
              View on Career Website →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
