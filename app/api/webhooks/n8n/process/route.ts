import { NextRequest } from "next/server";
import { runCareerWebsiteFlow } from "@/lib/career-website-flow";
import { unauthorized, verifyWebhookSecret } from "@/lib/webhook-auth";

export const maxDuration = 300;

/**
 * Career Website webhook step.
 *
 * Flow: Get Application → Download Resume → Extract PDF → Parse → Structured Output
 * → Update Candidate → Get JD → Match → Update Score → Notify Recruiter
 *
 * Called by n8n after application.received, or by the in-app apply() fallback.
 */
export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) return unauthorized();

  const body = (await request.json().catch(() => null)) as {
    applicationId?: string;
    skipNotify?: boolean;
  } | null;

  if (!body?.applicationId) {
    return Response.json({ error: "applicationId is required." }, { status: 400 });
  }

  try {
    const result = await runCareerWebsiteFlow(body.applicationId, {
      skipNotify: body.skipNotify,
    });
    return Response.json({
      stage: "processed",
      flow: "Career Website → Notify Recruiter",
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed.";
    const status = message.includes("not found") ? 404 : 502;
    console.error("[webhook/process]", body.applicationId, message);
    return Response.json({ error: message }, { status });
  }
}
