import { requireRecruiter } from "@/lib/auth";
import { getApplication, saveInterview, updateApplicationStatus } from "@/lib/db";
import { googleCalendarPayload } from "@/lib/n8n";

export const maxDuration = 60;

/** Recruiter decision actions: shortlist | reject | schedule */
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireRecruiter();
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as {
    action?: "shortlist" | "reject" | "schedule";
    scheduledDate?: string;
    scheduledTime?: string;
    format?: string;
    durationMinutes?: number;
    notes?: string;
  } | null;

  if (!body?.action) {
    return Response.json({ error: "action is required." }, { status: 400 });
  }

  const application = await getApplication(id);
  if (!application) {
    return Response.json({ error: "Application not found." }, { status: 404 });
  }

  try {
    if (body.action === "shortlist") {
      await updateApplicationStatus(id, "shortlisted", application.match_score ?? undefined, application.rank ?? undefined);
      return Response.json({ ok: true, status: "shortlisted" });
    }

    if (body.action === "reject") {
      await updateApplicationStatus(id, "rejected", application.match_score ?? undefined, application.rank ?? undefined);
      return Response.json({ ok: true, status: "rejected" });
    }

    if (body.action === "schedule") {
      const scheduledDate = body.scheduledDate;
      const scheduledTime = body.scheduledTime || "10:00 AM";
      if (!scheduledDate) {
        return Response.json({ error: "scheduledDate is required." }, { status: 400 });
      }

      const interview = await saveInterview({
        applicationId: id,
        jobTitle: application.job_title || "Open Role",
        candidateName: application.applicant_name,
        candidateEmail: application.applicant_email,
        scheduledDate,
        scheduledTime,
        format: body.format || "video",
        durationMinutes: body.durationMinutes ?? 30,
        notes: body.notes || "Scheduled by recruiter from dashboard.",
      });

      const calendar = googleCalendarPayload({
        candidateName: application.applicant_name,
        candidateEmail: application.applicant_email,
        jobTitle: application.job_title || "Open Role",
        scheduledDate,
        scheduledTime,
        durationMinutes: body.durationMinutes ?? 30,
        format: body.format || "video",
      });

      const emailCandidate = {
        to: application.applicant_email,
        subject: `Interview scheduled — ${application.job_title}`,
        body: [
          `Hi ${application.applicant_name},`,
          ``,
          `Your interview for ${application.job_title} is scheduled.`,
          `Date: ${scheduledDate}`,
          `Time: ${scheduledTime}`,
          `Format: ${body.format || "video"}`,
          ``,
          `We look forward to speaking with you.`,
        ].join("\n"),
      };

      const reminder = {
        sendAt: `${scheduledDate}T09:00:00`,
        channel: "email",
        body: `Reminder: interview on ${scheduledDate} at ${scheduledTime} for ${application.job_title}.`,
      };

      return Response.json({
        ok: true,
        status: "interview_scheduled",
        interviewId: interview.id,
        googleCalendar: calendar,
        emailCandidate,
        reminder,
      });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Action failed." },
      { status: 502 }
    );
  }
}
