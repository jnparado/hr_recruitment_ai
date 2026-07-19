import { requireRecruiter } from "@/lib/auth";
import { listDashboardCandidates } from "@/lib/db";
import { scoreApplication } from "@/lib/score-application";

export const maxDuration = 300;

/**
 * Score all applications that are missing a resume match_score.
 * Recruiter Admin uses this so Resume match / AI score bars get real numbers.
 */
export async function POST() {
  const auth = await requireRecruiter();
  if (auth.error) return auth.error;

  try {
    const candidates = await listDashboardCandidates();
    const unscored = candidates.filter(
      (c) => c.resumeMatchScore == null && c.status !== "rejected"
    );

    const results: {
      applicationId: string;
      matchScore?: number;
      error?: string;
    }[] = [];

    // Sequential to avoid AI rate limits
    for (const c of unscored.slice(0, 10)) {
      try {
        const scored = await scoreApplication(c.applicationId);
        results.push({
          applicationId: c.applicationId,
          matchScore: scored.matchScore,
        });
      } catch (err) {
        results.push({
          applicationId: c.applicationId,
          error: err instanceof Error ? err.message : "Scoring failed",
        });
      }
    }

    const ok = results.filter((r) => r.matchScore != null).length;
    return Response.json({
      ok: true,
      attempted: results.length,
      scored: ok,
      remaining: Math.max(0, unscored.length - results.length),
      results,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Bulk score failed." },
      { status: 502 }
    );
  }
}
