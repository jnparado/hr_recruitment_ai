import { uploadToBucket } from "@/lib/storage";
import { RESUME_BUCKET } from "@/lib/supabase";

export const maxDuration = 60;

/** Candidate uploads the session microphone recording after a voice interview. */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  const applicationId = String(form.get("applicationId") || "").trim();
  const audio = form.get("audio");

  if (!applicationId) {
    return Response.json({ error: "applicationId is required." }, { status: 400 });
  }
  if (!(audio instanceof File) || audio.size === 0) {
    return Response.json({ error: "Audio file is required." }, { status: 400 });
  }

  try {
    const ext = audio.name.includes(".")
      ? audio.name.split(".").pop()
      : audio.type.includes("webm")
        ? "webm"
        : "wav";
    const file = new File([audio], `interview.${ext}`, {
      type: audio.type || "audio/webm",
    });
    const stored = await uploadToBucket(
      RESUME_BUCKET,
      file,
      `interview-recordings/${applicationId}`
    );
    return Response.json({
      recordingUrl: stored.storageUrl,
      recordingPath: stored.storagePath,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 502 }
    );
  }
}
