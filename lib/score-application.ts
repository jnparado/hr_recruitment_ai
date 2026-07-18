import {
  getApplication,
  getJob,
  saveParsedCandidate,
  updateApplicationStatus,
} from "@/lib/db";
import { getSeedJob } from "@/lib/jobs";
import {
  fetchResumeBuffer,
  matchCandidateToJob,
  parseResumeFromBuffer,
} from "@/lib/parse";

export type ScoreApplicationResult = {
  applicationId: string;
  matchScore: number;
  recommendation: string;
  fitSummary: string;
};

/** Parse resume → match to job → save match_score on the application. */
export async function scoreApplication(
  applicationId: string
): Promise<ScoreApplicationResult> {
  const application = await getApplication(applicationId);
  if (!application) {
    throw new Error("Application not found.");
  }
  if (!application.resume_url) {
    throw new Error("Application has no resume URL.");
  }

  await updateApplicationStatus(application.id, "parsing");

  const buffer = await fetchResumeBuffer(application.resume_url);
  const fileName = application.resume_path?.split("/").pop() || "resume.pdf";
  const parsed = await parseResumeFromBuffer(buffer, fileName);

  await saveParsedCandidate(application.id, parsed);
  await updateApplicationStatus(application.id, "parsed");

  let jobDescription = "";
  if (application.job_id) {
    const job = await getJob(application.job_id);
    jobDescription = job
      ? `${job.description}\n\nRequirements:\n${job.requirements}`
      : "";
  }
  if (!jobDescription && application.job_title) {
    const seed = getSeedJob(
      application.job_id ||
        `seed-${application.job_title.toLowerCase().includes("software") ? "swe" : "hr"}`
    );
    jobDescription = seed
      ? `${seed.description}\n\nRequirements:\n${seed.requirements}`
      : application.job_title;
  }

  const match = await matchCandidateToJob(
    parsed,
    application.job_title || "Open Role",
    jobDescription
  );

  await updateApplicationStatus(application.id, "scored", match.matchScore);

  return {
    applicationId: application.id,
    matchScore: match.matchScore,
    recommendation: match.recommendation,
    fitSummary: match.fitSummary,
  };
}
