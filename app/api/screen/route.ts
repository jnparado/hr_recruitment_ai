import { grokJson } from "@/lib/grok";
import { extractResumeText } from "@/lib/extract";
import { storageForFile, uploadResumes } from "@/lib/storage";
import type { ScreeningResult } from "@/lib/types";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are an expert technical recruiter and resume screener.
You will receive a job description and the raw text of one candidate's resume.
Analyze how well the candidate matches the job and respond with ONLY a JSON object of this exact shape:

{
  "candidateName": string,            // full name from the resume, or "Unknown" if absent
  "email": string,                    // email from the resume, or "" if absent
  "currentRole": string,              // most recent job title, or "" if unclear
  "yearsOfExperience": number,        // estimated total relevant years, integer
  "matchScore": number,               // 0-100, how well the candidate fits THIS job
  "recommendation": "strong_match" | "good_match" | "possible_match" | "not_a_match",
  "summary": string,                  // 2-3 sentence overview of fit for this specific role
  "matchedSkills": string[],          // skills from the job description the candidate clearly has
  "skillGaps": [                      // required/desired skills the candidate lacks or has weak evidence for
    { "skill": string, "importance": "critical" | "important" | "nice-to-have", "note": string }
  ],
  "strengths": string[]               // 2-4 standout strengths relevant to the role
}

Scoring guidance: 85-100 strong_match, 70-84 good_match, 50-69 possible_match, below 50 not_a_match.
Be honest and calibrated - do not inflate scores. Base everything strictly on the resume text provided.`;

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  const jobDescription = String(form.get("jobDescription") || "").trim();
  const files = form.getAll("resumes").filter((f): f is File => f instanceof File);

  if (!jobDescription) {
    return Response.json({ error: "Job description is required." }, { status: 400 });
  }
  if (files.length === 0) {
    return Response.json({ error: "Upload at least one resume." }, { status: 400 });
  }
  if (files.length > 10) {
    return Response.json({ error: "Maximum 10 resumes per batch." }, { status: 400 });
  }

  const stored = await uploadResumes(files);

  const results: ScreeningResult[] = await Promise.all(
    files.map(async (file): Promise<ScreeningResult> => {
      const storage = storageForFile(stored, file.name);
      try {
        const resumeText = await extractResumeText(file);
        const analysis = await grokJson<Omit<ScreeningResult, "fileName" | "storagePath" | "storageUrl">>(
          SYSTEM_PROMPT,
          `JOB DESCRIPTION:\n${jobDescription}\n\nRESUME (${file.name}):\n${resumeText}`
        );
        return { ...analysis, fileName: file.name, ...storage };
      } catch (err) {
        return {
          fileName: file.name,
          candidateName: file.name,
          email: "",
          currentRole: "",
          yearsOfExperience: 0,
          matchScore: 0,
          recommendation: "not_a_match",
          summary: "",
          matchedSkills: [],
          skillGaps: [],
          strengths: [],
          ...storage,
          error: err instanceof Error ? err.message : "Failed to analyze this resume.",
        };
      }
    })
  );

  results.sort((a, b) => b.matchScore - a.matchScore);
  return Response.json({ results });
}
