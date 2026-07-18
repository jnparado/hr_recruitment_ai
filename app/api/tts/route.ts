import { openaiClient } from "@/lib/openai";

export const maxDuration = 60;

/** Converts text to speech using OpenAI TTS and returns MP3 audio. */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { text?: string } | null;
    const text = body?.text?.trim();
    if (!text) {
      return Response.json({ error: "Text is required." }, { status: 400 });
    }

    const speech = await openaiClient().audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL || "tts-1",
      voice: (process.env.OPENAI_TTS_VOICE || "nova") as
        | "alloy"
        | "ash"
        | "ballad"
        | "coral"
        | "echo"
        | "fable"
        | "nova"
        | "onyx"
        | "sage"
        | "shimmer",
      input: text.slice(0, 4096),
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    return new Response(buffer, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "OpenAI TTS failed." },
      { status: 502 }
    );
  }
}
