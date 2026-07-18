import { cursorEndSession } from "@/lib/cursor";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { sessionId?: string } | null;
  if (!body?.sessionId) {
    return Response.json({ error: "sessionId is required." }, { status: 400 });
  }

  try {
    await cursorEndSession(body.sessionId);
    return Response.json({ ended: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to end session." },
      { status: 500 }
    );
  }
}
