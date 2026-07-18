import { openaiClient } from "@/lib/openai";

export const maxDuration = 60;

/** Transcribes candidate audio using OpenAI Whisper. */
export async function POST(request: Request) {
  try {
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

    const transcription = await openaiClient().audio.transcriptions.create({
      file: audio,
      model: process.env.OPENAI_STT_MODEL || "whisper-1",
      language: "en",
    });

    return Response.json({ text: (transcription.text || "").trim() });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "OpenAI transcription failed." },
      { status: 502 }
    );
  }
}
