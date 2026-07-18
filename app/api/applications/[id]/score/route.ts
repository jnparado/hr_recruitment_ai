import { requireRecruiter } from "@/lib/auth";
import { scoreApplication } from "@/lib/score-application";

export const maxDuration = 300;

/** Recruiter: parse resume and compute match_score for an application. */
export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireRecruiter();
  if (auth.error) return auth.error;

  const { id } = await ctx.params;

  try {
    const result = await scoreApplication(id);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoring failed.";
    const status = message.includes("not found") ? 404 : 502;
    return Response.json({ error: message }, { status });
  }
}
