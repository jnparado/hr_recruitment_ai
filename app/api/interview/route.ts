import { cursorChatJson } from "@/lib/cursor";
import { INTERVIEW_QUESTION_LIMIT } from "@/lib/interview-config";
import { enrichInterviewSetup } from "@/lib/interview-context";
import type { ChatMessage, InterviewSetup } from "@/lib/types";

export const maxDuration = 180;

function systemPrompt(setup: InterviewSetup, questionNumber: number) {
  const resumeSection = setup.resumeText?.trim()
    ? setup.resumeText.trim().slice(0, 6000)
    : "(Resume text not available — ask general role-fit questions.)";

  const jobSection = (setup.jobDescription || "(not provided)").slice(0, 2500);
  const isLastQuestion = questionNumber >= INTERVIEW_QUESTION_LIMIT;

  return `You are a friendly AI interviewer doing a FIRST SCREENING call. Be brief.

Candidate: ${setup.candidateName || "the candidate"}
Role: ${setup.jobTitle}

Job:
${jobSection}

Resume:
---
${resumeSection}
---

Cover in order: experience → skills → salary → availability.
Rules:
- ONE short spoken question at a time (1-2 sentences max).
- Question ${questionNumber} of ${INTERVIEW_QUESTION_LIMIT}.
- Personalize using resume details.
- No scoring or feedback during the call.
${isLastQuestion
    ? `- FINAL turn: ask one last question if needed, then thank them and set "done": true.`
    : `- Stop after ${INTERVIEW_QUESTION_LIMIT} questions.`}

JSON only:
{"message": string, "done": boolean}`;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    setup?: InterviewSetup;
    messages?: ChatMessage[];
    convId?: string;
  } | null;

  if (!body?.setup?.jobTitle && !body?.setup?.applicationId) {
    return Response.json(
      { error: "Interview setup with a job title or application ID is required." },
      { status: 400 }
    );
  }

  const messages = body.messages ?? [];
  const questionsAsked = messages.filter((m) => m.role === "assistant").length;

  if (questionsAsked >= INTERVIEW_QUESTION_LIMIT) {
    return Response.json({
      message:
        "Thank you for your time today. We've covered everything we needed. Our team will review your responses and follow up soon. Have a great day!",
      done: true,
    });
  }

  try {
    const setup = await enrichInterviewSetup(body.setup!);
    const questionNumber = questionsAsked + 1;
    const reply = await cursorChatJson<{ message: string; done: boolean }>(
      systemPrompt(setup, questionNumber),
      messages,
      body.convId ?? setup.applicationId
    );

    if (questionNumber >= INTERVIEW_QUESTION_LIMIT) {
      reply.done = false;
    }

    return Response.json(reply);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Interview request failed." },
      { status: 500 }
    );
  }
}
