import { NextRequest } from "next/server";
import { getApplication } from "@/lib/db";
import { recruiterEmailPayload } from "@/lib/n8n";
import { verifyWebhookSecret, unauthorized } from "@/lib/webhook-auth";

/** n8n calls this to get recruiter email payload (wire to Gmail/SendGrid node) */
export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) return unauthorized();

  const body = (await request.json().catch(() => null)) as {
    applicationId?: string;
    matchScore?: number;
    rank?: number;
    fitSummary?: string;
  } | null;

  if (!body?.applicationId) {
    return Response.json({ error: "applicationId is required." }, { status: 400 });
  }

  const application = await getApplication(body.applicationId);
  if (!application) {
    return Response.json({ error: "Application not found." }, { status: 404 });
  }

  const email = recruiterEmailPayload({
    jobTitle: application.job_title || "Open Role",
    candidateName: application.applicant_name,
    candidateEmail: application.applicant_email,
    matchScore: body.matchScore ?? application.match_score ?? 0,
    rank: body.rank ?? application.rank ?? 0,
    fitSummary: body.fitSummary || "See application details in HR Process.",
    applicationId: application.id,
  });

  return Response.json({ stage: "notify", email });
}
