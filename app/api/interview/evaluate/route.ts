import { cursorJson } from "@/lib/cursor";
import { enrichInterviewSetup } from "@/lib/interview-context";
import type { ChatMessage, InterviewEvaluation, InterviewSetup } from "@/lib/types";

export const maxDuration = 90;

const SYSTEM_PROMPT = `You are a senior recruiter evaluating the transcript of a first screening interview.
You also have the candidate's resume and the job description for context.
Compare what the candidate said in the interview against their resume and the role requirements.
Based ONLY on the transcript (cross-referenced with the resume when relevant), respond with ONLY a JSON object of this exact shape:

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
Note inconsistencies between resume claims and interview answers in concerns.
Guidance: advance if overallScore >= 70 and no critical concerns, reject if below 45, otherwise maybe.`;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    setup?: InterviewSetup;
    messages?: ChatMessage[];
  } | null;

  if ((!body?.setup?.jobTitle && !body?.setup?.applicationId) || !body.messages || body.messages.length < 2) {
    return Response.json(
      { error: "A completed interview transcript is required." },
      { status: 400 }
    );
  }

  const transcript = body.messages
    .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n\n");

  try {
    const setup = await enrichInterviewSetup(body.setup!);
    const resumeSection = setup.resumeText?.trim()
      ? setup.resumeText.trim()
      : "(not available)";

    const evaluation = await cursorJson<InterviewEvaluation>(
      SYSTEM_PROMPT,
      `Role: ${setup.jobTitle}
Candidate: ${setup.candidateName || "Unknown"}

Job description:
${setup.jobDescription || "(not provided)"}

Candidate resume:
---
${resumeSection}
---

TRANSCRIPT:
${transcript}`
    );
    return Response.json(evaluation);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Evaluation request failed." },
      { status: 500 }
    );
  }
}
