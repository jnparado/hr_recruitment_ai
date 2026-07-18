import { aiJson } from "@/lib/ai";
import { extractText } from "unpdf";
import type { ParsedCandidate, SkillGap } from "@/lib/types";

const PARSE_PROMPT = `You are an expert AI resume parser for an HR recruitment system.
Extract structured data from the resume text and respond with ONLY a JSON object:

{
  "name": string,
  "email": string,
  "phone": string,
  "currentRole": string,
  "yearsOfExperience": number,
  "skills": string[],
  "experience": [
    { "role": string, "company": string, "duration": string, "highlights": string[] }
  ],
  "education": [
    { "degree": string, "institution": string, "year": string, "field": string }
  ],
  "certificates": [
    { "name": string, "issuer": string, "year": string }
  ]
}

Extract ALL skills, work experience, education entries, and certificates/credentials.
Use "" or [] or 0 for missing fields.`;

const MATCH_PROMPT = `You are an expert recruiter scoring candidate fit for a job.
Given parsed candidate data and a job description, respond with ONLY a JSON object:

{
  "matchScore": number,
  "matchedSkills": string[],
  "skillGaps": [
    { "skill": string, "importance": "critical" | "important" | "nice-to-have", "note": string }
  ],
  "fitSummary": string,
  "recommendation": "strong_match" | "good_match" | "possible_match" | "not_a_match"
}

Score 0-100. Be calibrated and honest.`;

export async function parseResumeFromBuffer(
  buffer: Buffer,
  fileName: string
): Promise<ParsedCandidate> {
  let text: string;
  if (fileName.toLowerCase().endsWith(".pdf")) {
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
    text = result.text;
  } else {
    text = buffer.toString("utf-8");
  }

  const cleaned = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) throw new Error("Could not extract text from resume.");

  return aiJson<ParsedCandidate>(
    PARSE_PROMPT,
    `RESUME (${fileName}):\n${cleaned.slice(0, 24000)}`
  );
}

export async function matchCandidateToJob(
  candidate: ParsedCandidate,
  jobTitle: string,
  jobDescription: string
): Promise<{
  matchScore: number;
  matchedSkills: string[];
  skillGaps: SkillGap[];
  fitSummary: string;
  recommendation: string;
}> {
  return aiJson(
    MATCH_PROMPT,
    `JOB: ${jobTitle}\nDESCRIPTION:\n${jobDescription}\n\nCANDIDATE:\n${JSON.stringify(candidate, null, 2)}`
  );
}

export async function fetchResumeBuffer(resumeUrl: string): Promise<Buffer> {
  const res = await fetch(resumeUrl);
  if (!res.ok) throw new Error(`Failed to fetch resume: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
