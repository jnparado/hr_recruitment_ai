import OpenAI from "openai";
import type { ChatMessage } from "@/lib/types";

/** Same model Cursor uses — fast path via xAI Chat Completions (not Cursor Agents). */
export const GROK_MODEL = process.env.GROK_MODEL || "grok-4.5";

export function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) return JSON.parse(fenced[1].trim()) as T;

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }

    throw new Error("Could not parse JSON from AI response.");
  }
}

function resolveProvider() {
  const xaiKey = process.env.XAI_API_KEY?.trim();
  if (xaiKey) {
    return {
      client: new OpenAI({ apiKey: xaiKey, baseURL: "https://api.x.ai/v1" }),
      model: GROK_MODEL,
      reasoningEffort: process.env.GROK_REASONING_EFFORT || "low",
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return {
      client: new OpenAI({ apiKey: openaiKey }),
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      reasoningEffort: undefined as string | undefined,
    };
  }

  throw new Error(
    "No AI key configured. Set XAI_API_KEY for Grok 4.5 (same model as Cursor) in .env.local."
  );
}

type CompleteOptions = {
  /** Routes multi-turn chats to the same xAI server for faster cache hits. */
  convId?: string;
  maxTokens?: number;
};

async function completeJson<T>(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: CompleteOptions = {}
): Promise<T> {
  const { client, model, reasoningEffort } = resolveProvider();

  const headers: Record<string, string> = {};
  if (options.convId) headers["x-grok-conv-id"] = options.convId;

  const completion = await client.chat.completions.create(
    {
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: options.maxTokens ?? 600,
      ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
    } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    Object.keys(headers).length ? { headers } : undefined
  );

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("AI returned an empty response.");
  return extractJson<T>(raw);
}

/** Fast JSON completion — system prompt + single user turn. */
export async function aiJson<T>(system: string, user: string): Promise<T> {
  return completeJson<T>([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
}

/** Fast JSON completion with full chat history (for live interviews). */
export async function aiChatJson<T>(
  system: string,
  history: ChatMessage[],
  convId?: string
): Promise<T> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  if (history.length === 0) {
    messages.push({
      role: "user",
      content: "Begin the interview. Greet the candidate and ask your first question.",
    });
  }

  return completeJson<T>(messages, { convId, maxTokens: 400 });
}
