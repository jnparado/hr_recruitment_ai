import { getApplication, getVoiceInterview } from "@/lib/db";
import { loadInterviewContext } from "@/lib/interview-context";

export const maxDuration = 60;

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/applications/[id]">
) {
  try {
    const { id } = await ctx.params;

    const application = await getApplication(id);
    if (!application) {
      return Response.json({ error: "Application not found." }, { status: 404 });
    }

    const [voiceInterview, interviewContext] = await Promise.all([
      getVoiceInterview(id).catch(() => null),
      loadInterviewContext(id).catch(() => null),
    ]);

    return Response.json({
      applicationId: application.id,
      candidateName: application.applicant_name,
      jobTitle: application.job_title,
      jobDescription: interviewContext?.jobDescription ?? "",
      resumeText: interviewContext?.resumeText ?? "",
      status: application.status,
      alreadyInterviewed: !!voiceInterview,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to load application." },
      { status: 500 }
    );
  }
}
