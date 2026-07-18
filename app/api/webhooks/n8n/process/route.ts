import { NextRequest } from "next/server";
import { scoreApplication } from "@/lib/score-application";
import { unauthorized, verifyWebhookSecret } from "@/lib/webhook-auth";

export const maxDuration = 300;

/** n8n calls this to: parse resume → match job → score → save to Supabase */
export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) return unauthorized();

  const body = (await request.json().catch(() => null)) as {
    applicationId?: string;
  } | null;
  if (!body?.applicationId) {
    return Response.json({ error: "applicationId is required." }, { status: 400 });
  }

  try {
    const result = await scoreApplication(body.applicationId);
    return Response.json({ stage: "processed", ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed.";
    const status = message.includes("not found") ? 404 : 502;
    return Response.json({ error: message }, { status });
  }
}
