import Link from "next/link";
import { RecruitmentFlow } from "@/app/_components/RecruitmentFlow";
import { listDashboardCandidates, listAllJobs, listScheduledInterviews } from "@/lib/db";

export default async function DashboardHomePage() {
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
    // Empty dashboard if DB not ready
  }

  const activeJobs = jobs.filter((j) => j.active || j.status === "open").length;
  const scored = candidates.filter((c) => c.resumeMatchScore != null);
  const aiAdvance = candidates.filter((c) => c.recommendation === "advance").length;
  const interviewed = candidates.filter((c) => c.interviewScore != null).length;
  const shortlisted = candidates.filter((c) => c.status === "shortlisted").length;
  const upcoming = interviews.slice(0, 5);

  const stats = [
    { label: "Total applicants", value: candidates.length, href: "/dashboard/applicants" },
    { label: "Active jobs", value: activeJobs, href: "/dashboard/jobs" },
    { label: "AI recommendations", value: aiAdvance, href: "/dashboard/ai" },
    {
      label: "Hiring progress",
      value: `${shortlisted} shortlisted · ${interviewed} AI interviewed`,
      href: "/dashboard/analytics",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Recruiter Admin
          </h1>
          <p className="mt-2 text-slate-600">
            Internal dashboard — review candidates, invite to AI interviews, and decide next steps.
          </p>
        </div>
        <Link
          href="/dashboard/applicants"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Manage candidates →
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {s.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Interview calendar</h2>
            <Link href="/dashboard/schedule" className="text-xs font-semibold text-emerald-700">
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No interviews scheduled yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.map((row) => (
                <li
                  key={String(row.id)}
                  className="flex justify-between gap-3 border-b border-slate-100 pb-2 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">{String(row.candidate_name)}</p>
                    <p className="text-xs text-slate-500">{String(row.job_title)}</p>
                  </div>
                  <p className="shrink-0 text-xs text-slate-600">
                    {String(row.scheduled_date)} · {String(row.scheduled_time)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">AI score snapshot</h2>
          <p className="mt-1 text-xs text-slate-500">
            {scored.length} scored resumes · avg{" "}
            {scored.length
              ? Math.round(
                  scored.reduce((a, c) => a + (c.resumeMatchScore || 0), 0) / scored.length
                )
              : "—"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/dashboard/ai"
              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
            >
              AI Features
            </Link>
            <Link
              href="/dashboard/applicants"
              className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Invite to AI Interview
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-10">
        <RecruitmentFlow />
      </div>
    </div>
  );
}
