import { listAiInterviewInvites } from "@/lib/ai-interview-invites";
import { listScheduledInterviews } from "@/lib/db";

export type InterviewCalendarKind = "ai" | "human";

/** Serializable calendar item for the Outlook-style UI. */
export type InterviewCalendarEvent = {
  id: string;
  kind: InterviewCalendarKind;
  title: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  /** YYYY-MM-DD in local calendar terms */
  date: string;
  /** Display time, e.g. "10:00 AM" or "Due by 5:00 PM" */
  timeLabel: string;
  /** Minutes from midnight for sorting / week grid (nullable for all-day style) */
  minutesFromMidnight: number | null;
  durationMinutes: number;
  status: string;
  applicationId: string | null;
  href: string;
  subtitle: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Local calendar date YYYY-MM-DD from Date or ISO string. */
export function toDateKey(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseTimeToMinutes(time: string): number | null {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  if (!ampm && h > 23) return null;
  return h * 60 + m;
}

function formatTimeLabel(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function humanEvents(
  rows: Awaited<ReturnType<typeof listScheduledInterviews>>
): InterviewCalendarEvent[] {
  return rows.map((row) => {
    const date = String(row.scheduled_date || "").slice(0, 10);
    const timeRaw = String(row.scheduled_time || "");
    const minutes = parseTimeToMinutes(timeRaw);
    const applicationId = row.application_id ? String(row.application_id) : null;
    return {
      id: `human-${row.id}`,
      kind: "human" as const,
      title: `Human interview · ${String(row.candidate_name)}`,
      candidateName: String(row.candidate_name),
      candidateEmail: String(row.candidate_email || ""),
      jobTitle: String(row.job_title || ""),
      date,
      timeLabel: timeRaw || "TBD",
      minutesFromMidnight: minutes,
      durationMinutes: Number(row.duration_minutes) || 30,
      status: String(row.format || "video"),
      applicationId,
      href: applicationId
        ? `/dashboard/candidates/${applicationId}`
        : "/dashboard/applicants",
      subtitle: `${String(row.format || "video")} · ${Number(row.duration_minutes) || 30} min`,
    };
  });
}

function aiEvents(
  invites: Awaited<ReturnType<typeof listAiInterviewInvites>>
): InterviewCalendarEvent[] {
  const events: InterviewCalendarEvent[] = [];

  for (const invite of invites) {
    if (invite.status === "revoked") continue;

    const applicationId = invite.application_id || null;
    const href = applicationId
      ? `/dashboard/candidates/${applicationId}`
      : "/dashboard/ai-interview";

    if (invite.completed_at || invite.status === "completed") {
      const done = new Date(invite.completed_at || invite.deadline);
      if (Number.isNaN(done.getTime())) continue;
      events.push({
        id: `ai-done-${invite.id}`,
        kind: "ai",
        title: `AI interview completed · ${invite.candidate_name}`,
        candidateName: invite.candidate_name,
        candidateEmail: invite.candidate_email,
        jobTitle: invite.job_title,
        date: toDateKey(done),
        timeLabel: formatTimeLabel(done),
        minutesFromMidnight: done.getHours() * 60 + done.getMinutes(),
        durationMinutes: invite.duration_minutes || 30,
        status: "completed",
        applicationId,
        href: applicationId ? `/dashboard/interviews/${applicationId}` : href,
        subtitle: "Completed · report available",
      });
      continue;
    }

    if (invite.started_at && invite.status === "in_progress") {
      const started = new Date(invite.started_at);
      if (!Number.isNaN(started.getTime())) {
        events.push({
          id: `ai-live-${invite.id}`,
          kind: "ai",
          title: `AI interview in progress · ${invite.candidate_name}`,
          candidateName: invite.candidate_name,
          candidateEmail: invite.candidate_email,
          jobTitle: invite.job_title,
          date: toDateKey(started),
          timeLabel: formatTimeLabel(started),
          minutesFromMidnight: started.getHours() * 60 + started.getMinutes(),
          durationMinutes: invite.duration_minutes || 30,
          status: "in_progress",
          applicationId,
          href,
          subtitle: "In progress",
        });
        continue;
      }
    }

    const deadline = new Date(invite.deadline);
    if (Number.isNaN(deadline.getTime())) continue;

    events.push({
      id: `ai-due-${invite.id}`,
      kind: "ai",
      title: `AI interview due · ${invite.candidate_name}`,
      candidateName: invite.candidate_name,
      candidateEmail: invite.candidate_email,
      jobTitle: invite.job_title,
      date: toDateKey(deadline),
      timeLabel: `Due ${formatTimeLabel(deadline)}`,
      minutesFromMidnight: deadline.getHours() * 60 + deadline.getMinutes(),
      durationMinutes: invite.duration_minutes || 30,
      status: invite.status || "pending",
      applicationId,
      href,
      subtitle: `Complete by deadline · ~${invite.duration_minutes || 30} min`,
    });
  }

  return events;
}

/** Load all AI + human interview events for the recruiter calendar. */
export async function listInterviewCalendarEvents(): Promise<InterviewCalendarEvent[]> {
  const [human, ai] = await Promise.all([
    listScheduledInterviews().catch(() => []),
    listAiInterviewInvites().catch(() => []),
  ]);

  const events = [...humanEvents(human), ...aiEvents(ai)].filter((e) => !!e.date);

  events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.minutesFromMidnight ?? 9999) - (b.minutesFromMidnight ?? 9999);
  });

  return events;
}
