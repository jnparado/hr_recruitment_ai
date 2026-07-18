import { openaiJson } from "@/lib/openai";
import type { ChatMessage, InterviewEvaluation, InterviewSetup } from "@/lib/types";

export const maxDuration = 120;

const SYSTEM_PROMPT = `You are a senior recruiter evaluating the transcript of a first screening interview.
Based ONLY on the transcript, respond with ONLY a JSON object of this exact shape:

{
  "overallScore": number,             // 0-100 overall candidate score for this role
  "recommendation": "advance" | "maybe" | "reject",
  "recommendationReason": string,     // 1-2 sentences justifying the recommendation
  "scores": {
    "experience": number,             // 0-100
    "skills": number,                 // 0-100
    "communication": number,          // 0-100, clarity and quality of answers
    "roleFit": number                 // 0-100, alignment with the specific role
  },
  "salaryExpectation": string,        // what the candidate stated, or "Not discussed"
  "availability": string,             // what the candidate stated, or "Not discussed"
  "keyHighlights": string[],          // 2-4 strongest points from the interview
  "concerns": string[]                // 0-4 concerns or open questions (empty array if none)
}

Be calibrated and honest. Short, evasive, or off-topic answers should lower scores.
Guidance: advance if overallScore >= 70 and no critical concerns, reject if below 45, otherwise maybe.`;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    setup?: InterviewSetup;
    messages?: ChatMessage[];
  } | null;

  if (!body?.setup?.jobTitle || !body.messages || body.messages.length < 2) {
    return Response.json(
      { error: "A completed interview transcript is required." },
      { status: 400 }
    );
  }

  const transcript = body.messages
    .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n\n");

  try {
    const evaluation = await openaiJson<InterviewEvaluation>(
      SYSTEM_PROMPT,
      `Role: ${body.setup.jobTitle}\nCandidate: ${body.setup.candidateName || "Unknown"}\nJob description:\n${body.setup.jobDescription || "(not provided)"}\n\nTRANSCRIPT:\n${transcript}`
    );
    return Response.json(evaluation);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "OpenAI request failed." },
      { status: 500 }
    );
  }
}
