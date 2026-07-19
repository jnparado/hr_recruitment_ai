"use client";

import { useEffect, useState } from "react";
import type { DashboardCandidate } from "@/lib/types";

export default function AnalyticsPage() {
  const [candidates, setCandidates] = useState<DashboardCandidate[]>([]);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setCandidates(d.candidates ?? []));
  }, []);

  const scored = candidates.filter((c) => c.resumeMatchScore != null);
  const interviewed = candidates.filter((c) => c.interviewScore != null);
  const shortlisted = candidates.filter((c) => c.status === "shortlisted");
  const rejected = candidates.filter((c) => c.status === "rejected");
  const scheduled = candidates.filter((c) => c.status === "interview_scheduled");

  const stats = [
    { label: "Total applicants", value: candidates.length },
    { label: "Scored resumes", value: scored.length },
    { label: "Voice interviews", value: interviewed.length },
    { label: "Shortlisted", value: shortlisted.length },
    { label: "Rejected", value: rejected.length },
    { label: "Scheduled", value: scheduled.length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics</h1>
      <p className="mt-1 text-sm text-slate-600">Pipeline snapshot across applicants.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
