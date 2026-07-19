/**
 * Career Website automation flow (matches the product diagram):
 *
 * Career Website → Webhook → Get Application → Download Resume → Extract PDF Text
 * → AI Resume Parser → Structured Output Parser → Update Candidate → Get Job Description
 * → AI Candidate Matcher → Update Match Score → Notify Recruiter
 */
import {
  getApplication,
  getJob,
  saveParsedCandidate,
  updateApplicationStatus,
} from "@/lib/db";
import { getSeedJob } from "@/lib/jobs";
import { recruiterEmailPayload, triggerN8nEmail } from "@/lib/n8n";
import {
  extractPdfText,
  fetchResumeBuffer,
  matchCandidateToJob,
  parseResumeWithAi,
  structuredOutputParser,
} from "@/lib/parse";
import type { ParsedCandidate } from "@/lib/types";
import { appBaseUrl } from "@/lib/app-url";

export const CAREER_WEBSITE_FLOW_STEPS = [
  "Career Website",
  "Webhook",
  "Get Application from Supabase",
  "Download Resume",
  "Extract PDF Text",
  "OpenAI Resume Parser",
  "Structured Output Parser",
  "Update Candidate in Supabase",
  "Get Job Description",
  "OpenAI Candidate Matcher",
  "Update Match Score",
  "Notify Recruiter",
] as const;

export type CareerWebsiteFlowStep = (typeof CAREER_WEBSITE_FLOW_STEPS)[number];

export type CareerWebsiteFlowResult = {
  applicationId: string;
  steps: { step: CareerWebsiteFlowStep; ok: boolean; detail?: string }[];
  parsed: ParsedCandidate;
  matchScore: number;
  recommendation: string;
  fitSummary: string;
  matchedSkills: string[];
  jobTitle: string;
  notify: {
    emailed: boolean;
    to: string;
    error?: string;
  };
};

function resolveJobDescription(
  jobId: string | null,
  jobTitle: string,
  fromDb: string
): string {
  if (fromDb) return fromDb;
  if (!jobTitle) return "Open Role";
  const seed = getSeedJob(
    jobId ||
      `seed-${jobTitle.toLowerCase().includes("software") ? "swe" : jobTitle.toLowerCase().includes("ai") ? "ai" : "hr"}`
  );
  return seed
    ? `${seed.description}\n\nRequirements:\n${seed.requirements}`
    : jobTitle;
}

/**
 * Run the full Career Website pipeline for one application.
 * Used by: apply() after hook, and POST /api/webhooks/n8n/process
 */
export async function runCareerWebsiteFlow(
  applicationId: string,
  options?: { skipNotify?: boolean }
): Promise<CareerWebsiteFlowResult> {
  const steps: CareerWebsiteFlowResult["steps"] = [
    { step: "Career Website", ok: true, detail: "Application submitted" },
    { step: "Webhook", ok: true, detail: "Pipeline started" },
  ];

  // ── Get Application from Supabase ──────────────────────────────────────────
  const application = await getApplication(applicationId);
  if (!application) {
    throw new Error("Get Application from Supabase failed: not found.");
  }
  if (!application.resume_url) {
    throw new Error("Application has no resume URL.");
  }
  steps.push({
    step: "Get Application from Supabase",
    ok: true,
    detail: `${application.applicant_name} → ${application.job_title}`,
  });

  await updateApplicationStatus(application.id, "parsing");

  // ── Download Resume ────────────────────────────────────────────────────────
  const buffer = await fetchResumeBuffer(application.resume_url);
  const fileName = application.resume_path?.split("/").pop() || "resume.pdf";
  steps.push({
    step: "Download Resume",
    ok: true,
    detail: `${fileName} (${buffer.length} bytes)`,
  });

  // ── Extract PDF Text ──────────────────────────────────────────────────────
  const resumeText = await extractPdfText(buffer, fileName);
  steps.push({
    step: "Extract PDF Text",
    ok: true,
    detail: `${resumeText.length} characters`,
  });

  // ── OpenAI Resume Parser (uses Cursor or OpenAI per AI_PROVIDER) ───────────
  const rawParsed = await parseResumeWithAi(resumeText, fileName);
  steps.push({
    step: "OpenAI Resume Parser",
    ok: true,
    detail: "Raw structured JSON received",
  });

  // ── Structured Output Parser ───────────────────────────────────────────────
  const parsed = structuredOutputParser(rawParsed);
  if (!parsed.name) parsed.name = application.applicant_name;
  if (!parsed.email) parsed.email = application.applicant_email;
  steps.push({
    step: "Structured Output Parser",
    ok: true,
    detail: `${parsed.name} · ${parsed.skills.length} skills`,
  });

  // ── Update Candidate in Supabase ───────────────────────────────────────────
  await saveParsedCandidate(application.id, parsed);
  await updateApplicationStatus(application.id, "parsed");
  steps.push({
    step: "Update Candidate in Supabase",
    ok: true,
    detail: "candidates row upserted",
  });

  // ── Get Job Description ────────────────────────────────────────────────────
  let jobDescription = "";
  if (application.job_id) {
    const job = await getJob(application.job_id);
    if (job) {
      jobDescription = `${job.description}\n\nRequirements:\n${job.requirements}`;
    }
  }
  jobDescription = resolveJobDescription(
    application.job_id,
    application.job_title || "",
    jobDescription
  );
  const jobTitle = application.job_title || "Open Role";
  steps.push({
    step: "Get Job Description",
    ok: true,
    detail: jobTitle,
  });

  // ── OpenAI Candidate Matcher ───────────────────────────────────────────────
  const match = await matchCandidateToJob(parsed, jobTitle, jobDescription);
  steps.push({
    step: "OpenAI Candidate Matcher",
    ok: true,
    detail: `${match.matchScore}/100 · ${match.recommendation}`,
  });

  // ── Update Match Score ─────────────────────────────────────────────────────
  await updateApplicationStatus(application.id, "scored", match.matchScore);
  steps.push({
    step: "Update Match Score",
    ok: true,
    detail: `applications.match_score = ${match.matchScore}`,
  });

  // ── Notify Recruiter ───────────────────────────────────────────────────────
  const email = recruiterEmailPayload({
    jobTitle,
    candidateName: parsed.name || application.applicant_name,
    candidateEmail: parsed.email || application.applicant_email,
    matchScore: match.matchScore,
    rank: 0,
    fitSummary: match.fitSummary || match.recommendation,
    applicationId: application.id,
  });

  let notify = { emailed: false, to: email.to, error: undefined as string | undefined };

  if (!options?.skipNotify) {
    const delivery = await triggerN8nEmail({
      event: "application.scored",
      email: {
        ...email,
        body: [
          email.body,
          ``,
          `Dashboard: ${appBaseUrl()}/dashboard/applicants`,
          `Matched skills: ${match.matchedSkills.join(", ") || "—"}`,
        ].join("\n"),
      },
      meta: {
        applicationId: application.id,
        matchScore: match.matchScore,
        recommendation: match.recommendation,
        steps: CAREER_WEBSITE_FLOW_STEPS,
      },
    });
    notify = {
      emailed: delivery.sent,
      to: email.to,
      error: delivery.error,
    };
  }

  steps.push({
    step: "Notify Recruiter",
    ok: true,
    detail: notify.emailed
      ? `Email sent to ${notify.to}`
      : `Email queued for ${notify.to}${notify.error ? ` (${notify.error})` : ""}`,
  });

  console.info("[career-website-flow]", {
    applicationId,
    matchScore: match.matchScore,
    steps: steps.map((s) => s.step),
    notify,
  });

  return {
    applicationId,
    steps,
    parsed,
    matchScore: match.matchScore,
    recommendation: match.recommendation,
    fitSummary: match.fitSummary,
    matchedSkills: match.matchedSkills,
    jobTitle,
    notify,
  };
}
