import { openaiJson } from "@/lib/openai";
import type { ChatMessage, InterviewSetup } from "@/lib/types";

export const maxDuration = 120;

function systemPrompt(setup: InterviewSetup) {
  return `You are a friendly, professional AI interviewer conducting a FIRST SCREENING interview.

Candidate: ${setup.candidateName || "the candidate"}
Role: ${setup.jobTitle}
Job description:
${setup.jobDescription || "(not provided)"}

Your job is to cover these four areas, roughly in this order:
1. Experience - background, recent roles, relevant accomplishments
2. Skills - technical/professional skills required by the role, with concrete examples
3. Salary expectations - expected compensation range
4. Availability - notice period / earliest start date, work arrangement constraints

Rules:
- Ask exactly ONE question at a time. Keep questions short and conversational.
- Ask natural follow-ups when an answer is vague or interesting, but keep the interview moving.
- Aim for about 6-9 questions total. Do not drag it out.
- Do not evaluate, score, or give feedback to the candidate during the interview.
- Once all four areas are covered, thank the candidate, tell them the team will follow up, and end the interview.

Respond with ONLY a JSON object:
{
  "message": string,  // what you say to the candidate next (greeting/question, or closing statement)
  "done": boolean     // true ONLY when you have just delivered the closing statement
}`;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    setup?: InterviewSetup;
    messages?: ChatMessage[];
  } | null;

  if (!body?.setup?.jobTitle) {
    return Response.json({ error: "Interview setup with a job title is required." }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const transcript =
    messages.length === 0
      ? "The interview has not started yet. Greet the candidate briefly and ask your first question."
      : messages
          .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
          .join("\n\n") + "\n\nProvide your next message as the interviewer.";

  try {
    const reply = await openaiJson<{ message: string; done: boolean }>(
      systemPrompt(body.setup),
      transcript
    );
    return Response.json(reply);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "OpenAI request failed." },
      { status: 500 }
    );
  }
}
