import { cursorChatJson } from "@/lib/cursor";
import { INTERVIEW_QUESTION_LIMIT } from "@/lib/interview-config";
import { enrichInterviewSetup } from "@/lib/interview-context";
import type { ChatMessage, InterviewSetup } from "@/lib/types";

export const maxDuration = 180;

function systemPrompt(setup: InterviewSetup, questionNumber: number) {
  const resumeSection = setup.resumeText?.trim()
    ? setup.resumeText.trim()
    : "(Resume text not available — ask general role-fit questions.)";

  const isLastQuestion = questionNumber >= INTERVIEW_QUESTION_LIMIT;

  return `You are a friendly, professional AI interviewer conducting a FIRST SCREENING interview.

Candidate: ${setup.candidateName || "the candidate"}
Role: ${setup.jobTitle}

Job description:
${setup.jobDescription || "(not provided)"}

Candidate resume (use this to personalize every question):
---
${resumeSection}
---

Your job is to cover these four areas, roughly in this order:
1. Experience — ask about specific roles, companies, and projects from their resume
2. Skills — probe skills listed on the resume against what this role requires; ask for concrete examples
3. Salary expectations — expected compensation range
4. Availability — notice period / earliest start date, work arrangement constraints

Rules:
- Ask exactly ONE question at a time. Keep questions short and conversational.
- Maximum ${INTERVIEW_QUESTION_LIMIT} questions total — you are on question ${questionNumber} of ${INTERVIEW_QUESTION_LIMIT}.
- Base questions on the resume above. Reference their actual job titles, companies, tools, and accomplishments by name.
- When the resume mentions something relevant to the role, dig deeper with a follow-up.
- If the resume is thin on a required skill, ask how they would apply their experience to fill that gap.
- Do not evaluate, score, or give feedback to the candidate during the interview.
${isLastQuestion
    ? `- This is your FINAL question (${INTERVIEW_QUESTION_LIMIT}/${INTERVIEW_QUESTION_LIMIT}). Ask one last question if needed, then thank the candidate, tell them the team will follow up, and end the interview. Set "done" to true.`
    : `- After question ${INTERVIEW_QUESTION_LIMIT}, you MUST stop. Do not ask more than ${INTERVIEW_QUESTION_LIMIT} questions.`}
- Once all four areas are covered OR you reach question ${INTERVIEW_QUESTION_LIMIT}, thank the candidate, tell them the team will follow up, and end the interview.

Respond with ONLY a JSON object:
{
  "message": string,
  "done": boolean
}`;
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
