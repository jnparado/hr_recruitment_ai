import { getApplication } from "@/lib/db";
import { candidateStatusLabel } from "@/lib/career-site";

/**
 * Public status lookup for candidates.
 * Requires application id + matching email (no recruiter data exposed).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    applicationId?: string;
    email?: string;
  } | null;

  const applicationId = String(body?.applicationId || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();

  if (!applicationId || !email) {
    return Response.json(
      { error: "Application ID and email are required." },
      { status: 400 }
    );
  }

  const application = await getApplication(applicationId);
  if (!application || application.applicant_email.toLowerCase() !== email) {
    return Response.json(
      { error: "No application found for that ID and email." },
      { status: 404 }
    );
  }

  return Response.json({
    applicationId: application.id,
    candidateName: application.applicant_name,
    jobTitle: application.job_title,
    status: application.status,
    statusLabel: candidateStatusLabel(application.status),
    appliedAt: application.created_at,
    confirmationNote:
      "A confirmation email was queued when you applied. Check your inbox (and spam folder).",
  });
}
