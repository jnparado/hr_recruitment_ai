import OpenAI from "openai";
import type { ChatMessage } from "@/lib/types";

const CURSOR_API_BASE = "https://api.cursor.com/v1";

export const CURSOR_MODEL = process.env.CURSOR_MODEL || "composer-2.5";
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

type CursorRun = {
  id: string;
  agentId: string;
  status: string;
  result?: string;
  error?: { message?: string };
};

type AgentCacheEntry = { agentId: string; createdAt: number };

const globalAgents = globalThis as typeof globalThis & {
  __cursorInterviewAgents?: Map<string, AgentCacheEntry>;
};

function agentCache() {
  if (!globalAgents.__cursorInterviewAgents) {
    globalAgents.__cursorInterviewAgents = new Map();
  }
  return globalAgents.__cursorInterviewAgents;
}

function openaiApiKey() {
  return process.env.OPENAI_API_KEY?.trim() || "";
}

function cursorApiKey() {
  return process.env.CURSOR_API_KEY?.trim() || "";
}

/** Prefer OpenAI when OPENAI_API_KEY is set; otherwise Cursor. */
export function aiProvider(): "openai" | "cursor" {
  if (openaiApiKey()) return "openai";
  if (cursorApiKey()) return "cursor";
  throw new Error(
    "No AI provider configured. Set OPENAI_API_KEY or CURSOR_API_KEY in .env.local."
  );
}

function requireCursorKey() {
  const key = cursorApiKey();
  if (!key) {
    throw new Error(
      "CURSOR_API_KEY is not set. Add it to .env.local (Cursor Dashboard → Integrations)."
    );
  }
  return key;
}

function openaiClient() {
  const key = openaiApiKey();
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local (https://platform.openai.com/api-keys)."
    );
  }
  return new OpenAI({ apiKey: key });
}

function authHeader(apiKey: string) {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

async function cursorFetch(path: string, init?: RequestInit) {
  const apiKey = requireCursorKey();
  const res = await fetch(`${CURSOR_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(apiKey),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Cursor API ${res.status}: ${detail || res.statusText}`);
  }

  return res;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollRun(agentId: string, runId: string, maxMs = 120_000): Promise<string> {
  const started = Date.now();

  while (Date.now() - started < maxMs) {
    const res = await cursorFetch(`/agents/${agentId}/runs/${runId}`);
    const run = (await res.json()) as CursorRun;
    const status = run.status?.toUpperCase();

    if (status === "FINISHED") {
      if (!run.result?.trim()) throw new Error("Cursor returned an empty response.");
      return run.result.trim();
    }

    if (status === "ERROR" || status === "CANCELLED" || status === "EXPIRED") {
      throw new Error(run.error?.message || `Cursor run ended with status ${run.status}`);
    }

    await sleep(1200);
  }

  throw new Error("Cursor run timed out.");
}

async function createRun(agentId: string, text: string): Promise<string> {
  const res = await cursorFetch(`/agents/${agentId}/runs`, {
    method: "POST",
    body: JSON.stringify({ prompt: { text } }),
  });
  const data = (await res.json()) as { run: { id: string } };
  return pollRun(agentId, data.run.id);
}

async function archiveAgent(agentId: string) {
  await cursorFetch(`/agents/${agentId}/archive`, { method: "POST" }).catch(() => {});
}

async function openaiJsonPrompt(system: string, user: string): Promise<string> {
  const client = openaiClient();
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("OpenAI returned an empty response.");
  return raw;
}

/** Send a one-shot prompt to Cursor cloud agent (no repo). */
export async function cursorPrompt(text: string, sessionId?: string): Promise<string> {
  if (sessionId) {
    const cached = agentCache().get(sessionId);
    if (cached) {
      try {
        return await createRun(cached.agentId, text);
      } catch {
        agentCache().delete(sessionId);
        await archiveAgent(cached.agentId);
      }
    }
  }

  const res = await cursorFetch("/agents", {
    method: "POST",
    body: JSON.stringify({
      prompt: { text },
      model: { id: CURSOR_MODEL },
    }),
  });

  const data = (await res.json()) as {
    agent: { id: string };
    run: { id: string };
  };

  if (sessionId) {
    agentCache().set(sessionId, { agentId: data.agent.id, createdAt: Date.now() });
    return pollRun(data.agent.id, data.run.id);
  }

  try {
    return await pollRun(data.agent.id, data.run.id);
  } finally {
    await archiveAgent(data.agent.id);
  }
}

/** End a multi-turn interview session and release the Cursor agent. */
export async function cursorEndSession(sessionId: string) {
  if (aiProvider() === "openai") return;
  const cached = agentCache().get(sessionId);
  if (!cached) return;
  agentCache().delete(sessionId);
  await archiveAgent(cached.agentId);
}

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

    const arrStart = trimmed.indexOf("[");
    const arrEnd = trimmed.lastIndexOf("]");
    if (arrStart >= 0 && arrEnd > arrStart) {
      return JSON.parse(trimmed.slice(arrStart, arrEnd + 1)) as T;
    }

    throw new Error("Could not parse JSON from AI response.");
  }
}

/** One-shot JSON completion via OpenAI (preferred) or Cursor. */
export async function cursorJson<T>(system: string, user: string): Promise<T> {
  const prompt = [
    system,
    "",
    "Important: respond with valid JSON only. No markdown fences, no commentary.",
    "",
    user,
  ].join("\n");

  if (aiProvider() === "openai") {
    const raw = await openaiJsonPrompt(
      "You are an HR AI assistant. Always respond with valid JSON only.",
      prompt
    );
    return extractJson<T>(raw);
  }

  const raw = await cursorPrompt(prompt);
  return extractJson<T>(raw);
}

/** Multi-turn JSON completion — OpenAI or Cursor agent session. */
export async function cursorChatJson<T>(
  system: string,
  history: ChatMessage[],
  sessionId?: string
): Promise<T> {
  const transcript =
    history.length === 0
      ? ""
      : history
          .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
          .join("\n");

  const user =
    history.length === 0
      ? "Begin the interview. Greet the candidate and ask your first question."
      : `Conversation so far:\n${transcript}\n\nContinue the interview with your next question or closing message.`;

  const prompt = [
    system,
    "",
    "Important: respond with valid JSON only. No markdown fences, no commentary.",
    "",
    user,
  ].join("\n");

  if (aiProvider() === "openai") {
    const raw = await openaiJsonPrompt(
      "You are an AI interviewer. Always respond with valid JSON only.",
      prompt
    );
    return extractJson<T>(raw);
  }

  const raw = await cursorPrompt(prompt, sessionId);
  return extractJson<T>(raw);
}
