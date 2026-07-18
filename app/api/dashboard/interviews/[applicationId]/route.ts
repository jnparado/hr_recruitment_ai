import { requireRecruiter } from "@/lib/auth";
import { getApplication, getVoiceInterview } from "@/lib/db";
import type { ChatMessage, InterviewEvaluation } from "@/lib/types";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ applicationId: string }> }
) {
  const auth = await requireRecruiter();
  if (auth.error) return auth.error;

  const { applicationId } = await ctx.params;

  try {
    const [application, voice] = await Promise.all([
      getApplication(applicationId),
      getVoiceInterview(applicationId),
    ]);

    if (!application) {
      return Response.json({ error: "Application not found." }, { status: 404 });
    }
    if (!voice) {
      return Response.json(
        { error: "No voice interview recorded for this candidate yet." },
        { status: 404 }
      );
    }

    const evaluation = (voice.evaluation || {}) as InterviewEvaluation;
    const transcript = (voice.transcript || []) as ChatMessage[];
    const recordingUrl =
      (typeof voice.recording_url === "string" && voice.recording_url) ||
      (typeof (evaluation as { recordingUrl?: string }).recordingUrl === "string"
        ? (evaluation as { recordingUrl?: string }).recordingUrl
        : null);

    return Response.json({
      applicationId: application.id,
      candidateName: application.applicant_name,
      email: application.applicant_email,
      jobTitle: application.job_title,
      status: application.status,
      resumeMatchScore: application.match_score,
      completedAt: voice.completed_at,
      overallScore: voice.overall_score,
      recommendation: voice.recommendation,
      evaluation,
      transcript,
      recordingUrl,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to load interview." },
      { status: 502 }
    );
  }
}
