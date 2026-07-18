import { aiChatJson } from "@/lib/ai";
import { enrichInterviewSetup } from "@/lib/interview-context";
import type { ChatMessage, InterviewSetup } from "@/lib/types";

export const maxDuration = 90;

function systemPrompt(setup: InterviewSetup) {
  const resumeSection = setup.resumeText?.trim()
    ? setup.resumeText.trim()
    : "(Resume text not available — ask general role-fit questions.)";

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
- Base questions on the resume above. Reference their actual job titles, companies, tools, and accomplishments by name.
- Ask exactly ONE question at a time. Keep questions short and conversational.
- When the resume mentions something relevant to the role, dig deeper with a follow-up.
- If the resume is thin on a required skill, ask how they would apply their experience to fill that gap.
- Aim for about 6-9 questions total. Do not drag it out.
- Do not evaluate, score, or give feedback to the candidate during the interview.
- Once all four areas are covered, thank the candidate, tell them the team will follow up, and end the interview.

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

  try {
    const setup = await enrichInterviewSetup(body.setup!);
    const reply = await aiChatJson<{ message: string; done: boolean }>(
      systemPrompt(setup),
      messages,
      body.convId ?? setup.applicationId
    );
    return Response.json(reply);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Interview request failed." },
      { status: 500 }
    );
  }
}
