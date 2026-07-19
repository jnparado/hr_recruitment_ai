"use client";

import { useEffect, useState } from "react";
import type { DashboardCandidate } from "@/lib/types";

function scoreClass(score: number | null) {
  if (score == null) return "text-slate-400";
  if (score >= 70) return "text-emerald-600";
  if (score >= 45) return "text-amber-600";
  return "text-rose-600";
}

export default function RankingPage() {
  const [candidates, setCandidates] = useState<DashboardCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.candidates ?? []) as DashboardCandidate[];
        list.sort(
          (a, b) =>
            (b.resumeMatchScore ?? b.interviewScore ?? 0) -
            (a.resumeMatchScore ?? a.interviewScore ?? 0)
        );
        setCandidates(list);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Candidate Ranking
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Ordered by resume match score (then interview score).
      </p>
      {loading && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      <ol className="mt-6 space-y-2">
        {candidates.map((c, i) => (
          <li
            key={c.applicationId}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {c.rank ?? i + 1}
              </span>
              <div>
                <p className="font-medium text-slate-900">{c.candidateName}</p>
                <p className="text-xs text-slate-500">{c.jobTitle}</p>
              </div>
            </div>
            <p className={`text-lg font-bold ${scoreClass(c.resumeMatchScore)}`}>
              {c.resumeMatchScore ?? "—"}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
