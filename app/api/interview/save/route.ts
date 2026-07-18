import { saveVoiceInterview } from "@/lib/db";
import type { ChatMessage, InterviewEvaluation } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    applicationId?: string;
    messages?: ChatMessage[];
    evaluation?: InterviewEvaluation;
  } | null;

  if (!body?.applicationId || !body.evaluation || !body.messages) {
    return Response.json(
      { error: "applicationId, messages, and evaluation are required." },
      { status: 400 }
    );
  }

  try {
    await saveVoiceInterview({
      applicationId: body.applicationId,
      transcript: body.messages,
      evaluation: body.evaluation,
    });
    return Response.json({ saved: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to save interview." },
      { status: 502 }
    );
  }
}
