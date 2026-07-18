"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CANDIDATE_FLOW_STEPS, FlowDiagram } from "@/app/_components/FlowDiagram";
import type { DashboardCandidate } from "@/lib/types";

function scoreClass(score: number | null) {
  if (score == null) return "text-slate-400";
  if (score >= 70) return "text-emerald-600";
  if (score >= 45) return "text-amber-600";
  return "text-rose-600";
}

function recBadge(rec: string | null) {
  if (!rec) return "bg-slate-100 text-slate-600";
  if (rec === "advance") return "bg-emerald-100 text-emerald-800";
  if (rec === "maybe") return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<DashboardCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setCandidates(d.candidates ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const interviewed = candidates.filter((c) => c.interviewScore != null);
  const avgScore =
    interviewed.length > 0
      ? Math.round(interviewed.reduce((s, c) => s + (c.interviewScore ?? 0), 0) / interviewed.length)
      : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Recruiter Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Candidates who applied, completed AI voice interviews, and were scored by Grok.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6">
        <FlowDiagram
          title="Pipeline progress"
          steps={[...CANDIDATE_FLOW_STEPS]}
          activeStep="Recruiter Dashboard"
          variant="compact"
          accent="indigo"
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total applications", value: candidates.length },
          { label: "Voice interviews done", value: interviewed.length },
          { label: "Avg interview score", value: interviewed.length ? `${avgScore}/100` : "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
          <p className="mt-1 text-xs">Run <code className="rounded bg-rose-100 px-1">supabase/schema.sql</code> if tables are missing.</p>
        </div>
      )}

      {loading && <p className="mt-8 text-sm text-slate-500">Loading candidates…</p>}

      {!loading && candidates.length === 0 && !error && (
        <p className="mt-8 text-sm text-slate-500">
          No applications yet. Candidates apply at{" "}
          <Link href="/careers" className="text-indigo-600 hover:underline">
            /careers
          </Link>
          .
        </p>
      )}

      {candidates.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Resume score</th>
                <th className="px-4 py-3">Interview score</th>
                <th className="px-4 py-3">Recommendation</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.applicationId} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{c.candidateName}</p>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{c.jobTitle}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${scoreClass(c.resumeMatchScore)}`}>
                    {c.resumeMatchScore ?? "—"}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${scoreClass(c.interviewScore)}`}>
                    {c.interviewScore ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {c.recommendation ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${recBadge(c.recommendation)}`}>
                        {c.recommendation}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(c.appliedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {c.status !== "interview_completed" && (
                      <Link
                        href={`/call/${c.applicationId}`}
                        className="text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        Send AI call →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
