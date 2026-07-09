export const maxDuration = 60;

/** Proxies text to xAI's Grok TTS endpoint and streams back MP3 audio. */
export async function POST(request: Request) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "XAI_API_KEY is not set. Add it to .env.local." },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text?.trim();
  if (!text) {
    return Response.json({ error: "Text is required." }, { status: 400 });
  }

  const upstream = await fetch("https://api.x.ai/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text.slice(0, 4000),
      voice_id: process.env.GROK_TTS_VOICE || "eve",
      language: "en",
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return Response.json(
      { error: `Grok TTS failed (${upstream.status}). ${detail}`.trim() },
      { status: 502 }
    );
  }

  return new Response(upstream.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
