import { requireRecruiter } from "@/lib/auth";
import { listScheduledInterviews } from "@/lib/db";

export default async function SchedulePage() {
  const auth = await requireRecruiter();
  if (auth.error) {
    return <p className="text-sm text-rose-700">Recruiter login required.</p>;
  }

  let interviews: Awaited<ReturnType<typeof listScheduledInterviews>> = [];
  let error: string | null = null;
  try {
    interviews = await listScheduledInterviews();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load schedule.";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Interview Schedule
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Scheduled interviews (Google Calendar + reminder payloads ready for n8n).
      </p>
      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {!error && interviews.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">
          No interviews scheduled yet. Shortlist a candidate on Applicants, then schedule.
        </p>
      )}
      <div className="mt-6 space-y-3">
        {interviews.map((iv) => (
          <div
            key={String(iv.id)}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="font-semibold text-slate-900">{String(iv.candidate_name)}</p>
            <p className="text-sm text-slate-600">{String(iv.job_title)}</p>
            <p className="mt-1 text-xs text-slate-500">
              {String(iv.scheduled_date)} · {String(iv.scheduled_time)} ·{" "}
              {String(iv.format)} · {String(iv.duration_minutes)} min
            </p>
            <p className="mt-1 text-xs text-slate-400">{String(iv.candidate_email)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
