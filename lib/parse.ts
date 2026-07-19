import { cursorJson } from "@/lib/cursor";
import { extractText } from "unpdf";
import type {
  CertificateEntry,
  EducationEntry,
  ExperienceEntry,
  ParsedCandidate,
  SkillGap,
} from "@/lib/types";

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

/** Download Resume — fetch PDF bytes from storage URL. */
export async function fetchResumeBuffer(resumeUrl: string): Promise<Buffer> {
  const res = await fetch(resumeUrl);
  if (!res.ok) throw new Error(`Failed to fetch resume: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Extract PDF Text — plain text from resume bytes. */
export async function extractPdfText(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  let text: string;
  if (fileName.toLowerCase().endsWith(".pdf")) {
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
    text = result.text;
  } else {
    text = buffer.toString("utf-8");
  }

  const cleaned = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) throw new Error("Could not extract text from resume.");
  return cleaned;
}

/**
 * Structured Output Parser — normalize / validate AI JSON into ParsedCandidate.
 */
export function structuredOutputParser(raw: unknown): ParsedCandidate {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const experience = Array.isArray(obj.experience)
    ? (obj.experience as ExperienceEntry[]).map((e) => ({
        role: String(e?.role ?? ""),
        company: String(e?.company ?? ""),
        duration: String(e?.duration ?? ""),
        highlights: Array.isArray(e?.highlights)
          ? e.highlights.map(String)
          : [],
      }))
    : [];

  const education = Array.isArray(obj.education)
    ? (obj.education as EducationEntry[]).map((e) => ({
        degree: String(e?.degree ?? ""),
        institution: String(e?.institution ?? ""),
        year: String(e?.year ?? ""),
        field: String(e?.field ?? ""),
      }))
    : [];

  const certificates = Array.isArray(obj.certificates)
    ? (obj.certificates as CertificateEntry[]).map((c) => ({
        name: String(c?.name ?? ""),
        issuer: String(c?.issuer ?? ""),
        year: String(c?.year ?? ""),
      }))
    : [];

  return {
    name: String(obj.name ?? "").trim(),
    email: String(obj.email ?? "").trim(),
    phone: String(obj.phone ?? "").trim(),
    currentRole: String(obj.currentRole ?? "").trim(),
    yearsOfExperience: Number(obj.yearsOfExperience) || 0,
    skills: Array.isArray(obj.skills) ? obj.skills.map(String) : [],
    experience,
    education,
    certificates,
  };
}

/** OpenAI / Cursor Resume Parser — raw JSON from LLM. */
export async function parseResumeWithAi(resumeText: string, fileName: string) {
  return cursorJson<unknown>(
    PARSE_PROMPT,
    `RESUME (${fileName}):\n${resumeText.slice(0, 24000)}`
  );
}

/** Full parse: extract text → AI parser → structured output. */
export async function parseResumeFromBuffer(
  buffer: Buffer,
  fileName: string
): Promise<ParsedCandidate> {
  const text = await extractPdfText(buffer, fileName);
  const raw = await parseResumeWithAi(text, fileName);
  return structuredOutputParser(raw);
}

/** OpenAI / Cursor Candidate Matcher. */
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
  const raw = await cursorJson<Record<string, unknown>>(
    MATCH_PROMPT,
    `JOB: ${jobTitle}\nDESCRIPTION:\n${jobDescription}\n\nCANDIDATE:\n${JSON.stringify(candidate, null, 2)}`
  );

  const matchScore = Math.max(0, Math.min(100, Number(raw.matchScore) || 0));
  return {
    matchScore,
    matchedSkills: Array.isArray(raw.matchedSkills)
      ? raw.matchedSkills.map(String)
      : [],
    skillGaps: Array.isArray(raw.skillGaps) ? (raw.skillGaps as SkillGap[]) : [],
    fitSummary: String(raw.fitSummary ?? ""),
    recommendation: String(raw.recommendation ?? "possible_match"),
  };
}
