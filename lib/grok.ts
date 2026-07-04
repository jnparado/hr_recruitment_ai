import OpenAI from "openai";

export const GROK_MODEL = process.env.GROK_MODEL || "grok-4.3";

export function grokClient() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "XAI_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  return new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
}

/**
 * Calls Grok with a system + user prompt and parses the response as JSON.
 * Uses xAI's JSON mode so the model always returns a valid JSON object.
 */
export async function grokJson<T>(system: string, user: string): Promise<T> {
  const client = grokClient();
  const completion = await client.chat.completions.create({
    model: GROK_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Grok returned an empty response.");
  return JSON.parse(raw) as T;
}
