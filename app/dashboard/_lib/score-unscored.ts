/** Client helper: score applications missing resume match_score. */
export type ScoreUnscoredResponse = {
  ok?: boolean;
  attempted?: number;
  scored?: number;
  remaining?: number;
  results?: { applicationId: string; matchScore?: number; error?: string }[];
  error?: string;
};

export async function scoreUnscoredOnce(): Promise<ScoreUnscoredResponse> {
  const r = await fetch("/api/dashboard/score-unscored", { method: "POST" });
  const d = (await r.json()) as ScoreUnscoredResponse;
  if (!r.ok) {
    throw new Error(d.error || "Bulk resume scoring failed.");
  }
  return d;
}

/**
 * Keep scoring until no unscored apps left, or a batch scores nothing (errors / stuck).
 * Calls `onProgress` after each batch so the UI can reload.
 */
export async function scoreAllUnscored(
  onProgress?: (info: ScoreUnscoredResponse) => void | Promise<void>
): Promise<{ totalScored: number; last: ScoreUnscoredResponse }> {
  let totalScored = 0;
  let last: ScoreUnscoredResponse = { remaining: 0 };

  for (let i = 0; i < 20; i++) {
    last = await scoreUnscoredOnce();
    totalScored += last.scored ?? 0;
    await onProgress?.(last);
    if ((last.remaining ?? 0) <= 0) break;
    if ((last.scored ?? 0) === 0) break;
  }

  return { totalScored, last };
}
