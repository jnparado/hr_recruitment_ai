import { cursorJson } from "@/lib/cursor";
import { extractResumeText } from "@/lib/extract";
import { storageForFile, uploadResumes } from "@/lib/storage";
import type {
  ExtractedResume,
  InterviewSchedule,
  JobOpening,
  RankedCandidate,
  RecruiterReport,
} from "@/lib/types";

export const maxDuration = 300;

const EXTRACT_AND_MATCH_PROMPT = `You are an expert HR AI that parses resumes and matches candidates to job openings.

Given resume text and a list of job openings, respond with ONLY a JSON object:

{
  "candidateName": string,
  "email": string,
  "phone": string,
  "currentRole": string,
  "yearsOfExperience": number,
  "skills": string[],
  "experience": [
    { "role": string, "company": string, "duration": string, "highlights": string[] }
  ],
  "certificates": [
    { "name": string, "issuer": string, "year": string }
  ],
  "education": [
    { "degree": string, "institution": string, "year": string, "field": string }
  ],
  "jobMatches": [
    {
      "jobId": string,
      "matchScore": number,
      "matchedSkills": string[],
      "skillGaps": [
        { "skill": string, "importance": "critical" | "important" | "nice-to-have", "note": string }
      ],
      "fitSummary": string
    }
  ]
}

Rules:
- Extract ALL skills, work experience entries, education, and certificates/credentials from the resume.
- Score each job 0-100 based on fit. Be calibrated and honest.
- Include one jobMatches entry per job opening provided (use the exact jobId).
- If a field is missing from the resume, use "" or [] or 0 as appropriate.`;

const SCHEDULE_AND_REPORT_PROMPT = `You are a senior recruiter preparing interview schedules and a hiring report.

Given ranked candidates and job context, respond with ONLY a JSON object:

{
  "schedule": [
    {
      "candidateName": string,
      "candidateEmail": string,
      "jobTitle": string,
      "proposedDate": string,
      "proposedTime": string,
      "format": "video" | "phone" | "in-person",
      "durationMinutes": number,
      "notes": string
    }
  ],
  "report": {
    "executiveSummary": string,
    "topCandidates": [
      {
        "name": string,
        "rank": number,
        "score": number,
        "recommendation": string,
        "keyStrength": string
      }
    ],
    "actionItems": string[],
    "riskFlags": string[]
  }
}

Rules:
- Schedule interviews ONLY for candidates with matchScore >= 50. Propose slots on upcoming weekdays, 30-min duration, staggered times (e.g. 9:00 AM, 10:00 AM).
- proposedDate format: "YYYY-MM-DD" (use realistic upcoming business dates from today's context).
- proposedTime format: "9:00 AM", "2:30 PM", etc.
- Default format to "video" unless role suggests otherwise.
- executiveSummary: 3-4 sentences for the hiring manager.
- topCandidates: include all scheduled candidates with rank, score, recommendation (Strong/Good/Possible/Pass), and one key strength.
- actionItems: 3-5 concrete next steps for the recruiter.
- riskFlags: gaps or concerns across the pool (empty array if none).`;

interface ExtractMatchResponse {
  candidateName: string;
  email: string;
  phone: string;
  currentRole: string;
  yearsOfExperience: number;
  skills: string[];
  experience: ExtractedResume["experience"];
  certificates: ExtractedResume["certificates"];
  education: ExtractedResume["education"];
  jobMatches: {
    jobId: string;
    matchScore: number;
    matchedSkills: string[];
    skillGaps: RankedCandidate["bestMatch"]["skillGaps"];
    fitSummary: string;
  }[];
}

function parseJobs(raw: string): JobOpening[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((j, i) => ({
          id: String((j as JobOpening).id || `job-${i + 1}`),
          title: String((j as JobOpening).title || `Job ${i + 1}`),
          description: String((j as JobOpening).description || ""),
        }))
        .filter((j) => j.description.trim());
    }
  } catch {
    // fall through to single-job mode
  }

  return [{ id: "job-1", title: "Open Role", description: trimmed }];
}

function rankCandidates(
  extractions: { fileName: string; data: ExtractMatchResponse }[],
  jobs: JobOpening[],
  stored: Awaited<ReturnType<typeof uploadResumes>>
): RankedCandidate[] {
  const jobMap = new Map(jobs.map((j) => [j.id, j.title]));

  const ranked = extractions
    .filter((e) => e.data.jobMatches?.length)
    .map((e) => {
      const allMatches = e.data.jobMatches
        .map((m) => ({
          jobId: m.jobId,
          jobTitle: jobMap.get(m.jobId) || m.jobId,
          matchScore: m.matchScore,
          matchedSkills: m.matchedSkills,
          skillGaps: m.skillGaps,
          fitSummary: m.fitSummary,
        }))
        .sort((a, b) => b.matchScore - a.matchScore);

      const bestMatch = allMatches[0];
      const storage = storageForFile(stored, e.fileName);
      return {
        fileName: e.fileName,
        candidateName: e.data.candidateName,
        email: e.data.email,
        phone: e.data.phone,
        currentRole: e.data.currentRole,
        yearsOfExperience: e.data.yearsOfExperience,
        skills: e.data.skills,
        experience: e.data.experience,
        certificates: e.data.certificates,
        education: e.data.education ?? [],
        storagePath: storage.storagePath,
        storageUrl: storage.storageUrl,
        rank: 0,
        bestMatch,
        allMatches,
      };
    })
    .sort((a, b) => b.bestMatch.matchScore - a.bestMatch.matchScore);

  ranked.forEach((c, i) => {
    c.rank = i + 1;
  });

  return ranked;
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  const jobsRaw = String(form.get("jobs") || form.get("jobDescription") || "").trim();
  const files = form.getAll("resumes").filter((f): f is File => f instanceof File);

  const jobs = parseJobs(jobsRaw);
  if (jobs.length === 0) {
    return Response.json({ error: "At least one job description is required." }, { status: 400 });
  }
  if (files.length === 0) {
    return Response.json({ error: "Upload at least one resume." }, { status: 400 });
  }
  if (files.length > 10) {
    return Response.json({ error: "Maximum 10 resumes per batch." }, { status: 400 });
  }

  const jobsContext = jobs
    .map((j) => `ID: ${j.id}\nTitle: ${j.title}\nDescription:\n${j.description}`)
    .join("\n\n---\n\n");

  const stored = await uploadResumes(files);

  const extractionResults = await Promise.all(
    files.map(async (file) => {
      try {
        const resumeText = await extractResumeText(file);
        const data = await cursorJson<ExtractMatchResponse>(
          EXTRACT_AND_MATCH_PROMPT,
          `JOB OPENINGS:\n${jobsContext}\n\nRESUME (${file.name}):\n${resumeText}`
        );
        return { fileName: file.name, data };
      } catch (err) {
        return {
          fileName: file.name,
          data: null as ExtractMatchResponse | null,
          error: err instanceof Error ? err.message : "Extraction failed.",
        };
      }
    })
  );

  const extractions: ExtractedResume[] = extractionResults.map((r) => {
    const storage = storageForFile(stored, r.fileName);
    if (!r.data) {
      return {
        fileName: r.fileName,
        candidateName: r.fileName,
        email: "",
        phone: "",
        currentRole: "",
        yearsOfExperience: 0,
        skills: [],
        experience: [],
        certificates: [],
        education: [],
        storagePath: storage.storagePath,
        storageUrl: storage.storageUrl,
        error: (r as { error?: string }).error,
      };
    }
    return {
      fileName: r.fileName,
      candidateName: r.data.candidateName,
      email: r.data.email,
      phone: r.data.phone,
      currentRole: r.data.currentRole,
      yearsOfExperience: r.data.yearsOfExperience,
      skills: r.data.skills,
      experience: r.data.experience,
      certificates: r.data.certificates,
      education: r.data.education ?? [],
      storagePath: storage.storagePath,
      storageUrl: storage.storageUrl,
    };
  });

  const successful = extractionResults.filter(
    (r): r is { fileName: string; data: ExtractMatchResponse } => r.data !== null
  );

  const ranked = rankCandidates(successful, jobs, stored);
  const qualified = ranked.filter((c) => c.bestMatch.matchScore >= 50);
  const primaryJob = jobs[0];

  let schedule: InterviewSchedule[] = [];
  let reportPartial: Omit<RecruiterReport, "generatedAt" | "primaryJobTitle" | "totalResumes" | "qualifiedCount" | "interviewSchedule"> = {
    executiveSummary: "",
    topCandidates: [],
    actionItems: [],
    riskFlags: [],
  };

  if (qualified.length > 0) {
    const candidateSummary = qualified
      .slice(0, 8)
      .map(
        (c) =>
          `#${c.rank} ${c.candidateName} (${c.email}) — ${c.bestMatch.jobTitle}: ${c.bestMatch.matchScore}/100\nSkills: ${c.skills.slice(0, 8).join(", ")}\nFit: ${c.bestMatch.fitSummary}`
      )
      .join("\n\n");

    const today = new Date().toISOString().slice(0, 10);
    const result = await cursorJson<{
      schedule: InterviewSchedule[];
      report: typeof reportPartial;
    }>(
      SCHEDULE_AND_REPORT_PROMPT,
      `Today: ${today}\nPrimary role: ${primaryJob.title}\n\nQUALIFIED CANDIDATES:\n${candidateSummary}`
    );

    schedule = result.schedule;
    reportPartial = result.report;
  } else {
    reportPartial = {
      executiveSummary:
        "No candidates met the minimum qualification threshold (50/100 match score) for the open role(s). Consider revising job requirements or expanding the candidate pool.",
      topCandidates: ranked.slice(0, 3).map((c) => ({
        name: c.candidateName,
        rank: c.rank,
        score: c.bestMatch.matchScore,
        recommendation: "Pass",
        keyStrength: c.skills[0] || "N/A",
      })),
      actionItems: [
        "Review job description requirements for overly strict criteria",
        "Re-post the role on additional job boards",
        "Consider phone-screening borderline candidates manually",
      ],
      riskFlags: ranked.length
        ? ["No candidates scored above 50 — talent pool may not match current requirements"]
        : ["All resume extractions failed — check file formats"],
    };
  }

  const report: RecruiterReport = {
    generatedAt: new Date().toISOString(),
    primaryJobTitle: primaryJob.title,
    totalResumes: files.length,
    qualifiedCount: qualified.length,
    executiveSummary: reportPartial.executiveSummary,
    topCandidates: reportPartial.topCandidates,
    interviewSchedule: schedule,
    actionItems: reportPartial.actionItems,
    riskFlags: reportPartial.riskFlags,
  };

  return Response.json({
    stage: "complete",
    stored,
    extractions,
    ranked,
    schedule,
    report,
  });
}
