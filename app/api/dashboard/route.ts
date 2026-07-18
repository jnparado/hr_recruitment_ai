import { listDashboardCandidates } from "@/lib/db";

export async function GET() {
  try {
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
