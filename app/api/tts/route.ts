export const maxDuration = 60;

/** Voice uses browser Web Speech API on the client — this route is unused. */
export async function POST() {
  return Response.json(
    {
      error:
        "Server TTS is disabled. Voice interviews use your browser's built-in speech (Chrome/Edge recommended).",
    },
    { status: 410 }
  );
}
