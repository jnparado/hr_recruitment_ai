import { NextRequest } from "next/server";
import { rankApplicationsForJob, rankApplicationsByTitle } from "@/lib/db";
import { recruiterEmailPayload } from "@/lib/n8n";
import { verifyWebhookSecret, unauthorized } from "@/lib/webhook-auth";

/** n8n calls this to rank all candidates for a job and prepare recruiter email payload */
export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) return unauthorized();

  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    jobTitle?: string;
    applicationId?: string;
  } | null;

  if (!body?.jobId && !body?.jobTitle) {
    return Response.json({ error: "jobId or jobTitle is required." }, { status: 400 });
  }

  const ranked = body.jobId && !body.jobId.startsWith("seed-")
    ? await rankApplicationsForJob(body.jobId)
    : await rankApplicationsByTitle(body.jobTitle || "");

  const top = ranked[0];
  const emailPayload = top
    ? recruiterEmailPayload({
        jobTitle: top.job_title || "Open Role",
        candidateName: top.applicant_name,
        candidateEmail: top.applicant_email,
        matchScore: top.match_score ?? 0,
        rank: top.rank ?? 1,
        fitSummary: `Ranked #${top.rank} with score ${top.match_score}/100`,
        applicationId: top.id,
      })
    : null;

  return Response.json({
    stage: "ranked",
    jobId: body.jobId,
    ranked: ranked.map((a) => ({
      applicationId: a.id,
      name: a.applicant_name,
      email: a.applicant_email,
      matchScore: a.match_score,
      rank: a.rank,
    })),
    recruiterEmail: emailPayload,
  });
}

/** GET variant for n8n HTTP node with query params */
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) return Response.json({ error: "jobId required" }, { status: 400 });
  return POST(
    new NextRequest(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({ jobId }),
    })
  );
}
