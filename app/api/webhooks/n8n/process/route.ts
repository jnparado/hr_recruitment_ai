import { NextRequest } from "next/server";
import {
  getApplication,
  getJob,
  saveParsedCandidate,
  updateApplicationStatus,
} from "@/lib/db";
import { fetchResumeBuffer, matchCandidateToJob, parseResumeFromBuffer } from "@/lib/parse";
import { getSeedJob } from "@/lib/jobs";
import { verifyWebhookSecret, unauthorized } from "@/lib/webhook-auth";

export const maxDuration = 300;

/** n8n calls this to: parse resume → match job → score → save to Supabase */
export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) return unauthorized();

  const body = (await request.json().catch(() => null)) as { applicationId?: string } | null;
  if (!body?.applicationId) {
    return Response.json({ error: "applicationId is required." }, { status: 400 });
  }

  const application = await getApplication(body.applicationId);
  if (!application) {
    return Response.json({ error: "Application not found." }, { status: 404 });
  }

  await updateApplicationStatus(application.id, "parsing");

  const buffer = await fetchResumeBuffer(application.resume_url);
  const fileName = application.resume_path.split("/").pop() || "resume.pdf";
  const parsed = await parseResumeFromBuffer(buffer, fileName);

  await saveParsedCandidate(application.id, parsed);
  await updateApplicationStatus(application.id, "parsed");

  let jobDescription = "";
  if (application.job_id) {
    const job = await getJob(application.job_id);
    jobDescription = job ? `${job.description}\n\nRequirements:\n${job.requirements}` : "";
  }
  if (!jobDescription && application.job_title) {
    const seed = getSeedJob(
      application.job_id || `seed-${application.job_title.toLowerCase().includes("software") ? "swe" : "hr"}`
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

  return Response.json({
    stage: "processed",
    applicationId: application.id,
    parsed,
    match,
  });
}
