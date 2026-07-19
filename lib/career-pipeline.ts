import {
  getApplication,
  rankApplicationsByTitle,
  rankApplicationsForJob,
  saveInterview,
} from "@/lib/db";
import { googleCalendarPayload, recruiterEmailPayload } from "@/lib/n8n";
import { scoreApplication } from "@/lib/score-application";

function nextWeekdaySlot(daysAhead = 2): { date: string; time: string } {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  const date = d.toISOString().slice(0, 10);
  return { date, time: "10:00 AM" };
}

/**
 * Career Website pipeline after apply:
 * Parse → Save → Match JD → Score → Rank → Email payload → Schedule → Calendar → Reminder
 * (n8n can own these steps when configured; this runs as the in-app fallback.)
 */
export async function runCareerWebsitePipeline(applicationId: string) {
  const scored = await scoreApplication(applicationId);
  const application = await getApplication(applicationId);
  if (!application) {
    throw new Error("Application not found after scoring.");
  }

  const ranked = application.job_id
    ? await rankApplicationsForJob(application.job_id)
    : await rankApplicationsByTitle(application.job_title || "");

  const self = ranked.find((a) => a.id === applicationId);
  const rankedIndex = ranked.findIndex((a) => a.id === applicationId);
  const rank = self?.rank ?? (rankedIndex >= 0 ? rankedIndex + 1 : 1);

  const email = recruiterEmailPayload({
    jobTitle: application.job_title || "Open Role",
    candidateName: application.applicant_name,
    candidateEmail: application.applicant_email,
    matchScore: scored.matchScore,
    rank: rank || 1,
    fitSummary: scored.fitSummary || scored.recommendation,
    applicationId,
  });

  let schedule: {
    date: string;
    time: string;
    interviewId?: string;
    googleCalendar: ReturnType<typeof googleCalendarPayload>;
    reminder: { sendAt: string; channel: string; body: string };
  } | null = null;

  if (scored.matchScore >= 50) {
    const slot = nextWeekdaySlot(2);
    const saved = await saveInterview({
      applicationId,
      jobTitle: application.job_title || "Open Role",
      candidateName: application.applicant_name,
      candidateEmail: application.applicant_email,
      scheduledDate: slot.date,
      scheduledTime: slot.time,
      format: "video",
      durationMinutes: 30,
      notes: "Auto-scheduled after Career Website pipeline scoring.",
    });

    const googleCalendar = googleCalendarPayload({
      candidateName: application.applicant_name,
      candidateEmail: application.applicant_email,
      jobTitle: application.job_title || "Open Role",
      scheduledDate: slot.date,
      scheduledTime: slot.time,
      durationMinutes: 30,
      format: "video",
    });

    schedule = {
      date: slot.date,
      time: slot.time,
      interviewId: saved.id,
      googleCalendar,
      reminder: {
        sendAt: `${slot.date}T09:00:00`,
        channel: "email",
        body: `Hi ${application.applicant_name},\n\nReminder: your interview for ${application.job_title} is on ${slot.date} at ${slot.time}.\n\nGood luck!`,
      },
    };
  }

  console.info("[career-pipeline]", {
    applicationId,
    matchScore: scored.matchScore,
    rank,
    emailTo: email.to,
    scheduled: !!schedule,
  });

  return {
    applicationId,
    matchScore: scored.matchScore,
    recommendation: scored.recommendation,
    fitSummary: scored.fitSummary,
    rank,
    email,
    schedule,
  };
}
