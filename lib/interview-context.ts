import { getApplication, getJob } from "@/lib/db";
import { SEED_JOBS } from "@/lib/jobs";
import { downloadResumeText } from "@/lib/storage";
import type { InterviewSetup } from "@/lib/types";

async function resolveJobDescription(
  jobId: string | null,
  jobTitle: string
): Promise<string> {
  if (jobId) {
    const job = await getJob(jobId);
    if (job) {
      const parts = [job.description];
      if (job.requirements) parts.push(`Requirements:\n${job.requirements}`);
      return parts.join("\n\n");
    }
  }

  const seed =
    SEED_JOBS.find((j) => j.id === jobId) ?? SEED_JOBS.find((j) => j.title === jobTitle);
  if (seed) {
    const parts = [seed.description];
    if (seed.requirements) parts.push(`Requirements:\n${seed.requirements}`);
    return parts.join("\n\n");
  }

  return "";
}

/** Loads job description + resume text for a career application interview. */
export async function loadInterviewContext(applicationId: string): Promise<InterviewSetup | null> {
  const app = await getApplication(applicationId);
  if (!app) return null;

  const jobDescription = await resolveJobDescription(app.job_id, app.job_title);

  let resumeText = "";
  try {
    resumeText = await downloadResumeText(app.resume_path);
  } catch {
    // Interview can still run with job description only
  }

  return {
    applicationId: app.id,
    candidateName: app.applicant_name,
    jobTitle: app.job_title,
    jobDescription,
    resumeText,
  };
}

/** Ensures setup includes resume + job description when applicationId is present. */
export async function enrichInterviewSetup(setup: InterviewSetup): Promise<InterviewSetup> {
  // Client already loaded context — skip slow resume download on every turn
  if (setup.jobDescription?.trim() && setup.resumeText?.trim()) {
    return setup;
  }

  if (!setup.applicationId) return setup;

  const ctx = await loadInterviewContext(setup.applicationId);
  if (!ctx) return setup;

  return {
    ...ctx,
    ...setup,
    candidateName: setup.candidateName || ctx.candidateName,
    jobTitle: setup.jobTitle || ctx.jobTitle,
    jobDescription: setup.jobDescription || ctx.jobDescription,
    resumeText: setup.resumeText || ctx.resumeText,
  };
}
