const CURSOR_API_BASE = "https://api.cursor.com/v1";

export const CURSOR_MODEL = process.env.CURSOR_MODEL || "composer-2.5";

type CursorRun = {
  id: string;
  agentId: string;
  status: string;
  result?: string;
  error?: { message?: string };
};

function cursorApiKey() {
  const key = process.env.CURSOR_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "CURSOR_API_KEY is not set. Add it to .env.local (Cursor Dashboard → Integrations)."
    );
  }
  return key;
}

function authHeader(apiKey: string) {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

async function cursorFetch(path: string, init?: RequestInit) {
  const apiKey = cursorApiKey();
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

    await sleep(1500);
  }

  throw new Error("Cursor run timed out.");
}

/** Send a one-shot prompt to a Cursor cloud agent (no repo). */
export async function cursorPrompt(text: string): Promise<string> {
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

  try {
    return await pollRun(data.agent.id, data.run.id);
  } finally {
    void cursorFetch(`/agents/${data.agent.id}/archive`, { method: "POST" }).catch(() => {});
  }
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

    throw new Error("Could not parse JSON from Cursor response.");
  }
}

/** Calls Cursor with a system + user prompt and parses JSON from the reply. */
export async function cursorJson<T>(system: string, user: string): Promise<T> {
  const prompt = [
    system,
    "",
    "Important: respond with valid JSON only. No markdown fences, no commentary.",
    "",
    user,
  ].join("\n");

  const raw = await cursorPrompt(prompt);
  return extractJson<T>(raw);
}
