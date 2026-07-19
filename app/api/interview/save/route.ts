import { after } from "next/server";
import {
  markAiInterviewInviteCompletedByApplication,
  recruiterInterviewReportEmail,
} from "@/lib/ai-interview-invites";
import { appOriginFromRequest } from "@/lib/app-url";
import { getApplication, saveVoiceInterview, saveVoiceInterviewTranscript } from "@/lib/db";
import { triggerN8nEmail } from "@/lib/n8n";
import type { ChatMessage, InterviewEvaluation } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    applicationId?: string;
    messages?: ChatMessage[];
    evaluation?: InterviewEvaluation;
    transcriptOnly?: boolean;
    recordingUrl?: string;
  } | null;

  if (!body?.applicationId || !body.messages?.length) {
    return Response.json(
      { error: "applicationId and messages are required." },
      { status: 400 }
    );
  }

  try {
    if (body.transcriptOnly) {
      await saveVoiceInterviewTranscript({
        applicationId: body.applicationId,
        transcript: body.messages,
      });
      return Response.json({ saved: true, stage: "transcript" });
    }

    if (!body.evaluation) {
      return Response.json({ error: "evaluation is required." }, { status: 400 });
    }

    await saveVoiceInterview({
      applicationId: body.applicationId,
      transcript: body.messages,
      evaluation: body.evaluation,
      recordingUrl: body.recordingUrl,
    });

    const applicationId = body.applicationId;
    const evaluation = body.evaluation;
    const origin = appOriginFromRequest(request);

    after(async () => {
      try {
        await markAiInterviewInviteCompletedByApplication(applicationId);
        const application = await getApplication(applicationId);
        if (!application) return;

        const email = recruiterInterviewReportEmail({
          candidateName: application.applicant_name,
          candidateEmail: application.applicant_email,
          jobTitle: application.job_title || "Open Role",
          applicationId,
          overallScore: evaluation.overallScore,
          recommendation: evaluation.recommendation,
          dashboardUrl: `${origin}/dashboard/interviews/${applicationId}`,
        });

        await triggerN8nEmail({
          event: "ai_interview.report",
          email,
          meta: {
            applicationId,
            overallScore: evaluation.overallScore,
            recommendation: evaluation.recommendation,
          },
        });
      } catch (err) {
        console.error("[interview/save] report notify failed:", err);
      }
    });

    return Response.json({ saved: true, stage: "complete", reportQueued: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to save interview." },
      { status: 502 }
    );
  }
}
