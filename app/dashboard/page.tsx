import Link from "next/link";
import { listDashboardCandidates, listAllJobs, listScheduledInterviews } from "@/lib/db";

function scoreTone(score: number | null) {
  if (score == null) return "bg-slate-100 text-slate-500";
  if (score >= 70) return "bg-emerald-100 text-emerald-800";
  if (score >= 45) return "bg-amber-100 text-amber-900";
  return "bg-rose-100 text-rose-800";
}

function formatRelative(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const days = Math.floor((Date.now() - t) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

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

  const active = candidates.filter((c) => c.status !== "rejected");
  const activeJobs = jobs.filter((j) => j.active || j.status === "open").length;
  const scored = active.filter((c) => c.resumeMatchScore != null);
  const unscored = active.filter((c) => c.resumeMatchScore == null);
  const awaitingInterview = active.filter(
    (c) =>
      c.resumeMatchScore != null &&
      c.interviewScore == null &&
      c.status !== "rejected"
  );
  const aiAdvance = active.filter(
    (c) =>
      c.recommendation === "advance" ||
      c.recommendation === "strong_match" ||
      (c.resumeMatchScore != null && c.resumeMatchScore >= 70)
  ).length;
  const interviewed = active.filter((c) => c.interviewScore != null).length;
  const shortlisted = active.filter((c) => c.status === "shortlisted").length;
  const avgResume =
    scored.length > 0
      ? Math.round(
          scored.reduce((a, c) => a + (c.resumeMatchScore || 0), 0) / scored.length
        )
      : null;

  const topCandidates = [...active]
    .sort((a, b) => (b.resumeMatchScore ?? -1) - (a.resumeMatchScore ?? -1))
    .slice(0, 5);

  const recent = [...active]
    .sort((a, b) => +new Date(b.appliedAt) - +new Date(a.appliedAt))
    .slice(0, 5);

  const upcoming = interviews.slice(0, 5);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const attentionItems = [
    unscored.length > 0 && {
      label: `${unscored.length} resume${unscored.length === 1 ? "" : "s"} need AI scoring`,
      href: "/dashboard/applicants",
      tone: "amber" as const,
    },
    awaitingInterview.length > 0 && {
      label: `${awaitingInterview.length} ready to invite to AI Interview`,
      href: "/dashboard/ai-interview",
      tone: "indigo" as const,
    },
    upcoming.length > 0 && {
      label: `${upcoming.length} human interview${upcoming.length === 1 ? "" : "s"} on the calendar`,
      href: "/dashboard/schedule",
      tone: "emerald" as const,
    },
  ].filter(Boolean) as { label: string; href: string; tone: "amber" | "indigo" | "emerald" }[];

  const stats = [
    {
      label: "Pipeline",
      value: String(active.length),
      hint: `${candidates.length} total · ${shortlisted} shortlisted`,
      href: "/dashboard/applicants",
    },
    {
      label: "Open roles",
      value: String(activeJobs),
      hint: `${jobs.length} jobs in catalog`,
      href: "/dashboard/jobs",
    },
    {
      label: "Strong fits",
      value: String(aiAdvance),
      hint: "High match or AI advance",
      href: "/dashboard/ranking",
    },
    {
      label: "AI interviews",
      value: String(interviewed),
      hint: `${awaitingInterview.length} waiting for invite`,
      href: "/dashboard/ai-interview",
    },
  ];

  const quickLinks = [
    { href: "/dashboard/applicants", title: "Candidates", desc: "Review, score, decide" },
    { href: "/dashboard/ranking", title: "Ranking", desc: "Compare match scores" },
    { href: "/dashboard/ai-interview", title: "AI Interview", desc: "Invite & track rooms" },
    { href: "/dashboard/jobs", title: "Jobs", desc: "Open and edit roles" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 px-6 py-7 text-white shadow-sm sm:px-8 sm:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-teal-300/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/90">
              Hiring workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {greeting}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-emerald-50/90 sm:text-base">
              Your pipeline at a glance — score resumes, rank talent, run AI interviews,
              and move the right people forward.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/applicants"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
            >
              Manage candidates
            </Link>
            <Link
              href="/dashboard/ranking"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              View ranking
            </Link>
          </div>
        </div>

        {attentionItems.length > 0 && (
          <div className="relative mt-6 flex flex-wrap gap-2">
            {attentionItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  item.tone === "amber"
                    ? "bg-amber-300/90 text-amber-950 hover:bg-amber-200"
                    : item.tone === "indigo"
                      ? "bg-sky-200/90 text-sky-950 hover:bg-sky-100"
                      : "bg-emerald-200/90 text-emerald-950 hover:bg-emerald-100"
                }`}
              >
                {item.label} →
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {s.label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 transition group-hover:text-emerald-800">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{s.hint}</p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-50/60"
          >
            <p className="text-sm font-semibold text-slate-900">{q.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{q.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Top candidates */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">Top by resume match</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {scored.length} scored · avg {avgResume ?? "—"}
              </p>
            </div>
            <Link
              href="/dashboard/ranking"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Full ranking
            </Link>
          </div>

          {topCandidates.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              No applicants yet. New applications from the Career Website appear here.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {topCandidates.map((c, i) => (
                <li key={c.applicationId}>
                  <Link
                    href={`/dashboard/candidates/${c.applicationId}`}
                    className="flex items-center gap-3 py-3 transition hover:bg-slate-50/80"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {c.candidateName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {c.jobTitle}
                        {c.currentRole ? ` · ${c.currentRole}` : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreTone(
                        c.resumeMatchScore
                      )}`}
                    >
                      {c.resumeMatchScore != null ? `${c.resumeMatchScore}` : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Score + actions */}
        <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-slate-900">AI score snapshot</h2>
          <div className="mt-4 flex items-end gap-3">
            <p className="text-4xl font-bold tracking-tight text-slate-900">
              {avgResume ?? "—"}
            </p>
            <p className="mb-1 text-sm text-slate-500">avg resume match</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
              style={{ width: `${avgResume ?? 0}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {scored.length} scored · {unscored.length} pending AI score · {interviewed}{" "}
            interviewed
          </p>

          <div className="mt-auto flex flex-col gap-2 pt-6">
            <Link
              href="/dashboard/applicants"
              className="rounded-xl bg-emerald-600 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              {unscored.length > 0 ? "Score & review candidates" : "Open candidates"}
            </Link>
            <Link
              href="/dashboard/ai"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              AI Features
            </Link>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent applications */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent applications</h2>
            <Link
              href="/dashboard/applicants"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No applications yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recent.map((c) => (
                <li
                  key={c.applicationId}
                  className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/candidates/${c.applicationId}`}
                      className="font-medium text-slate-900 hover:text-emerald-800"
                    >
                      {c.candidateName}
                    </Link>
                    <p className="truncate text-xs text-slate-500">{c.jobTitle}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-500">{formatRelative(c.appliedAt)}</p>
                    <p className="mt-0.5 text-[10px] font-medium capitalize text-slate-400">
                      {c.status.replace(/_/g, " ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Calendar */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Interview calendar</h2>
            <Link
              href="/dashboard/schedule"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-700">No interviews scheduled</p>
              <p className="mt-1 text-xs text-slate-500">
                Shortlist a candidate, then schedule a human interview from Candidates.
              </p>
              <Link
                href="/dashboard/applicants"
                className="mt-4 inline-block text-xs font-semibold text-emerald-700 hover:underline"
              >
                Go to candidates →
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.map((row) => (
                <li
                  key={String(row.id)}
                  className="flex justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {String(row.candidate_name)}
                    </p>
                    <p className="text-xs text-slate-500">{String(row.job_title)}</p>
                  </div>
                  <p className="shrink-0 text-xs font-medium text-emerald-800">
                    {String(row.scheduled_date)}
                    <span className="block text-slate-500">
                      {String(row.scheduled_time)}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
