import { saveVoiceInterview, saveVoiceInterviewTranscript } from "@/lib/db";
import type { ChatMessage, InterviewEvaluation } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    applicationId?: string;
    messages?: ChatMessage[];
    evaluation?: InterviewEvaluation;
    transcriptOnly?: boolean;
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
    });
    return Response.json({ saved: true, stage: "complete" });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to save interview." },
      { status: 502 }
    );
  }
}
