import OpenAI from "openai";

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

export function openaiClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  return new OpenAI({ apiKey });
}

/** Calls OpenAI with a system + user prompt and parses the response as JSON. */
export async function openaiJson<T>(system: string, user: string): Promise<T> {
  const client = openaiClient();
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned an empty response.");
  return JSON.parse(raw) as T;
}
