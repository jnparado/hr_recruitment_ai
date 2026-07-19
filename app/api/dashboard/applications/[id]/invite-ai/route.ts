import { requireRecruiter } from "@/lib/auth";
import { appOriginFromRequest } from "@/lib/app-url";
import {
  aiInterviewInviteEmail,
  createAiInterviewInvite,
} from "@/lib/ai-interview-invites";
import { getApplication } from "@/lib/db";
import { triggerN8nEmail } from "@/lib/n8n";

/** Recruiter invites candidate to AI Interview Room via secure email link. */
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireRecruiter();
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as {
    durationMinutes?: number;
    deadlineDays?: number;
  } | null;

  const application = await getApplication(id);
  if (!application) {
    return Response.json({ error: "Application not found." }, { status: 404 });
  }

  try {
    const invite = await createAiInterviewInvite({
      application,
      durationMinutes: body?.durationMinutes,
      deadlineDays: body?.deadlineDays,
    });

    const origin = appOriginFromRequest(request);
    const interviewUrl = `${origin}/ai-interview/${invite.token}`;
    const email = aiInterviewInviteEmail({
      candidateName: invite.candidate_name,
      candidateEmail: invite.candidate_email,
      jobTitle: invite.job_title,
      interviewUrl,
      durationMinutes: invite.duration_minutes,
      deadline: invite.deadline,
    });

    const delivery = await triggerN8nEmail({
      event: "ai_interview.invite",
      email,
      meta: {
        applicationId: id,
        inviteId: invite.id,
        interviewUrl,
        deadline: invite.deadline,
      },
    });

    return Response.json({
      ok: true,
      status: "ai_interview_invited",
      inviteId: invite.id,
      token: invite.token,
      interviewUrl,
      deadline: invite.deadline,
      email,
      emailSent: delivery.sent,
      emailNote: delivery.sent
        ? `Invitation email sent to ${email.to}`
        : `Invitation created. Secure link ready — ${delivery.error || "email queued locally"}.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create AI interview invite.";
    const missingTable = /ai_interview_invites|schema cache/i.test(message);
    return Response.json(
      {
        error: missingTable
          ? "Database table ai_interview_invites is missing. In Supabase → SQL Editor, run supabase/migrations/20260719000000_ai_interview_and_jobs.sql (or npm run db:setup with SUPABASE_DB_PASSWORD)."
          : message,
      },
      { status: 502 }
    );
  }
}
