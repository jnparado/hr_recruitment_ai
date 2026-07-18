import { NextRequest } from "next/server";
import { getApplication, saveInterview } from "@/lib/db";
import { googleCalendarPayload } from "@/lib/n8n";
import { verifyWebhookSecret, unauthorized } from "@/lib/webhook-auth";

/** n8n calls this after Google Calendar node to save interview + return reminder payload */
export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) return unauthorized();

  const body = (await request.json().catch(() => null)) as {
    applicationId?: string;
    jobTitle?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    format?: string;
    durationMinutes?: number;
    calendarEventId?: string;
    notes?: string;
  } | null;

  if (!body?.applicationId || !body.scheduledDate || !body.scheduledTime) {
    return Response.json(
      { error: "applicationId, scheduledDate, and scheduledTime are required." },
      { status: 400 }
    );
  }

  const application = await getApplication(body.applicationId);
  if (!application) {
    return Response.json({ error: "Application not found." }, { status: 404 });
  }

  const interview = await saveInterview({
    applicationId: body.applicationId,
    jobTitle: body.jobTitle || application.job_title || "Open Role",
    candidateName: application.applicant_name,
    candidateEmail: application.applicant_email,
    scheduledDate: body.scheduledDate,
    scheduledTime: body.scheduledTime,
    format: body.format || "video",
    durationMinutes: body.durationMinutes ?? 30,
    calendarEventId: body.calendarEventId,
    notes: body.notes,
  });

  const calendar = googleCalendarPayload({
    candidateName: application.applicant_name,
    candidateEmail: application.applicant_email,
    jobTitle: body.jobTitle || application.job_title,
    scheduledDate: body.scheduledDate,
    scheduledTime: body.scheduledTime,
    durationMinutes: body.durationMinutes ?? 30,
    format: body.format || "video",
  });

  return Response.json({
    stage: "scheduled",
    interviewId: interview.id,
    googleCalendar: calendar,
    reminder: {
      sendAt: `${body.scheduledDate}T${body.scheduledTime}`,
      candidateEmail: application.applicant_email,
      subject: `Reminder: Interview for ${body.jobTitle || application.job_title}`,
      body: `Hi ${application.applicant_name},\n\nThis is a reminder about your upcoming ${body.format || "video"} interview on ${body.scheduledDate} at ${body.scheduledTime}.\n\nGood luck!`,
    },
  });
}
