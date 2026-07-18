import { getApplication, getVoiceInterview } from "@/lib/db";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/applications/[id]">
) {
  const { id } = await ctx.params;

  const application = await getApplication(id);
  if (!application) {
    return Response.json({ error: "Application not found." }, { status: 404 });
  }

  const voiceInterview = await getVoiceInterview(id).catch(() => null);

  return Response.json({
    applicationId: application.id,
    candidateName: application.applicant_name,
    jobTitle: application.job_title,
    status: application.status,
    alreadyInterviewed: !!voiceInterview,
  });
}
