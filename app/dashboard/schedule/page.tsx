import Link from "next/link";
import { InterviewCalendar } from "@/app/dashboard/_components/InterviewCalendar";
import { listInterviewCalendarEvents } from "@/lib/calendar-events";

export default async function SchedulePage() {
  let events: Awaited<ReturnType<typeof listInterviewCalendarEvents>> = [];
  try {
    events = await listInterviewCalendarEvents();
  } catch {
    events = [];
  }

  const aiCount = events.filter((e) => e.kind === "ai").length;
  const humanCount = events.filter((e) => e.kind === "human").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Interview calendar
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Outlook-style view of AI Interview Room invites and final human interviews.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/applicants"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Schedule human interview
          </Link>
          <Link
            href="/dashboard/applicants"
            className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100"
          >
            Invite to AI Interview
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            All on calendar
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{events.length}</p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">
            AI interviews
          </p>
          <p className="mt-1 text-2xl font-bold text-sky-950">{aiCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Human / final
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-950">{humanCount}</p>
        </div>
      </div>

      <InterviewCalendar events={events} />

      <p className="text-xs text-slate-500">
        <span className="font-semibold text-sky-700">AI</span> events use invite deadlines and
        completion times.{" "}
        <span className="font-semibold text-emerald-700">Human</span> events come from scheduled
        final interviews on Candidates.
      </p>
    </div>
  );
}
