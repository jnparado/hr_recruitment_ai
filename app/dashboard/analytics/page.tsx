import Link from "next/link";
import { listDashboardCandidates, listAllJobs, listScheduledInterviews } from "@/lib/db";

export default async function AnalyticsPage() {
  let candidates: Awaited<ReturnType<typeof listDashboardCandidates>> = [];
  let jobs: Awaited<ReturnType<typeof listAllJobs>> = [];
  let interviews: Awaited<ReturnType<typeof listScheduledInterviews>> = [];

  try {
    [candidates, jobs, interviews] = await Promise.all([
      listDashboardCandidates(),
      listAllJobs(),
      listScheduledInterviews(),
    ]);
  } catch {
    // empty
  }

  const byJob = new Map<string, number>();
  for (const c of candidates) {
    byJob.set(c.jobTitle || "Unknown", (byJob.get(c.jobTitle || "Unknown") || 0) + 1);
  }

  const funnel = [
    { stage: "Applied", count: candidates.length },
    { stage: "Scored", count: candidates.filter((c) => c.resumeMatchScore != null).length },
    {
      stage: "AI interviewed",
      count: candidates.filter((c) => c.interviewScore != null).length,
    },
    { stage: "Shortlisted", count: candidates.filter((c) => c.status === "shortlisted").length },
    {
      stage: "Human interview scheduled",
      count: interviews.length,
    },
    { stage: "Rejected", count: candidates.filter((c) => c.status === "rejected").length },
  ];

  const scores = candidates
    .map((c) => c.resumeMatchScore)
    .filter((s): s is number => s != null);
  const buckets = [
    { label: "0–39", count: scores.filter((s) => s < 40).length },
    { label: "40–69", count: scores.filter((s) => s >= 40 && s < 70).length },
    { label: "70–100", count: scores.filter((s) => s >= 70).length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics</h1>
      <p className="mt-1 text-sm text-slate-600">
        Time-to-hire proxies, funnel, applicants per job, and AI score distribution.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Active jobs"
          value={String(jobs.filter((j) => j.active).length)}
        />
        <Stat label="Total applicants" value={String(candidates.length)} />
        <Stat
          label="Avg AI resume score"
          value={
            scores.length
              ? String(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length))
              : "—"
          }
        />
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Hiring funnel</h2>
        <ul className="mt-4 space-y-2">
          {funnel.map((f) => (
            <li key={f.stage} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{f.stage}</span>
              <span className="font-semibold text-slate-900">{f.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Applicants per job</h2>
          <ul className="mt-4 space-y-2">
            {[...byJob.entries()].map(([title, count]) => (
              <li key={title} className="flex justify-between text-sm">
                <span className="truncate text-slate-600">{title}</span>
                <span className="font-semibold">{count}</span>
              </li>
            ))}
            {byJob.size === 0 && (
              <li className="text-sm text-slate-500">No applicants yet.</li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">AI score distribution</h2>
          <ul className="mt-4 space-y-2">
            {buckets.map((b) => (
              <li key={b.label} className="flex justify-between text-sm">
                <span className="text-slate-600">{b.label}</span>
                <span className="font-semibold">{b.count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            Source tracking & recruiter performance can be added when UTM / owner fields exist.
          </p>
        </section>
      </div>

      <Link
        href="/dashboard"
        className="mt-8 inline-block text-sm font-semibold text-emerald-700 hover:underline"
      >
        ← Dashboard
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
