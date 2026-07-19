import Link from "next/link";
import { listScheduledInterviews } from "@/lib/db";

export default async function InterviewsPage() {
  let rows: Awaited<ReturnType<typeof listScheduledInterviews>> = [];
  try {
    rows = await listScheduledInterviews();
  } catch {
    rows = [];
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Interview Management
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Schedule human interviews, calendar/Teams/Zoom payloads, and automated reminders.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            title: "Google Calendar",
            body: "Event payloads generated on schedule — connect via n8n.",
          },
          {
            title: "Microsoft Teams",
            body: "Meeting link field ready for Teams webhook integration.",
          },
          {
            title: "Zoom",
            body: "Meeting link field ready for Zoom webhook integration.",
          },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
          >
            <p className="font-semibold text-slate-900">{c.title}</p>
            <p className="mt-1 text-slate-600">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard/applicants"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Schedule from candidates
        </Link>
        <Link
          href="/dashboard/applicants"
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800"
        >
          Invite to AI Interview Room
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="font-semibold text-slate-900">Scheduled interviews</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No interviews scheduled.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {rows.map((row) => (
              <li key={String(row.id)} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{String(row.candidate_name)}</p>
                  <p className="text-xs text-slate-500">{String(row.job_title)}</p>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p>
                    {String(row.scheduled_date)} · {String(row.scheduled_time)}
                  </p>
                  <p className="capitalize">{String(row.format)} · {String(row.duration_minutes)} min</p>
                  <p>
                    Reminder: {row.reminder_sent ? "sent" : "pending"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
