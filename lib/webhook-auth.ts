import { NextRequest } from "next/server";

export function verifyWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return true;
  return request.headers.get("x-webhook-secret") === secret;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized webhook" }, { status: 401 });
}
