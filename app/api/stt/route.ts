export const maxDuration = 60;

/** Proxies recorded candidate audio to xAI's Grok STT endpoint and returns the transcript. */
export async function POST(request: Request) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "XAI_API_KEY is not set. Add it to .env.local." },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return Response.json({ error: "An audio file is required." }, { status: 400 });
  }

  // xAI requires the file field to come after all other form fields.
  const upstream = new FormData();
  upstream.append("language", "en");
  upstream.append("file", audio, audio.name || "answer.wav");

  const res = await fetch("https://api.x.ai/v1/stt", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: upstream,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return Response.json(
      { error: `Grok STT failed (${res.status}). ${detail}`.trim() },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { text?: string };
  return Response.json({ text: (data.text || "").trim() });
}
