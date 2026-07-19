import { requireRecruiter } from "@/lib/auth";
import { backfillCandidateStubs, listDashboardCandidates } from "@/lib/db";

export async function GET() {
  const auth = await requireRecruiter();
  if (auth.error) return auth.error;

  try {
    // Ensure applications always have a candidates row (name/email stub until parse).
    await backfillCandidateStubs().catch((err) => {
      console.warn("[dashboard] candidate stub backfill:", err);
    });

    const candidates = await listDashboardCandidates();
    candidates.sort((a, b) => {
      const scoreA = a.interviewScore ?? a.resumeMatchScore ?? 0;
      const scoreB = b.interviewScore ?? b.resumeMatchScore ?? 0;
      return scoreB - scoreA;
    });
    return Response.json({ candidates });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Dashboard unavailable." },
      { status: 502 }
    );
  }
}
