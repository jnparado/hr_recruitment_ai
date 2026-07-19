import { runCareerWebsiteFlow } from "@/lib/career-website-flow";

export type ScoreApplicationResult = {
  applicationId: string;
  matchScore: number;
  recommendation: string;
  fitSummary: string;
};

/**
 * Parse resume → match to job → save match_score (Career Website flow without notify).
 * Used by dashboard "Score resume" and legacy callers.
 */
export async function scoreApplication(
  applicationId: string
): Promise<ScoreApplicationResult> {
  const result = await runCareerWebsiteFlow(applicationId, { skipNotify: true });
  return {
    applicationId: result.applicationId,
    matchScore: result.matchScore,
    recommendation: result.recommendation,
    fitSummary: result.fitSummary,
  };
}
