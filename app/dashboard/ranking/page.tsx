"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DashboardCandidate } from "@/lib/types";

function scoreTone(score: number | null) {
  if (score == null) return { text: "text-slate-400", bar: "bg-slate-200", chip: "bg-slate-100 text-slate-600" };
  if (score >= 70) return { text: "text-emerald-700", bar: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-800" };
  if (score >= 45) return { text: "text-amber-700", bar: "bg-amber-500", chip: "bg-amber-100 text-amber-900" };
  return { text: "text-rose-700", bar: "bg-rose-500", chip: "bg-rose-100 text-rose-800" };
}

function recLabel(rec: string | null) {
  if (!rec) return null;
  if (rec === "advance" || rec === "strong_match") return { label: "Strong / Advance", className: "bg-emerald-100 text-emerald-800" };
  if (rec === "maybe" || rec === "good_match" || rec === "possible_match")
    return { label: "Possible", className: "bg-amber-100 text-amber-900" };
  return { label: "Not a match", className: "bg-rose-100 text-rose-800" };
}

function compositeScore(c: DashboardCandidate) {
  if (c.resumeMatchScore != null && c.interviewScore != null) {
    return Math.round(c.resumeMatchScore * 0.55 + c.interviewScore * 0.45);
  }
  return c.resumeMatchScore ?? c.interviewScore ?? null;
}

function ScoreMeter({ label, score }: { label: string; score: number | null }) {
  const tone = scoreTone(score);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className={`font-semibold ${tone.text}`}>
          {score != null ? `${score}/100` : "—"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${tone.bar}`}
          style={{ width: `${score != null ? score : 0}%` }}
        />
      </div>
    </div>
  );
}

export default function RankingPage() {
  const [candidates, setCandidates] = useState<DashboardCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobFilter, setJobFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"composite" | "resume" | "interview">("composite");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setCandidates((d.candidates ?? []) as DashboardCandidate[]);
      })
      .finally(() => setLoading(false));
  }, []);

  const jobs = useMemo(
    () => [...new Set(candidates.map((c) => c.jobTitle).filter(Boolean))].sort(),
    [candidates]
  );

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = candidates.filter((c) => {
      if (c.status === "rejected") return false;
      if (jobFilter !== "all" && c.jobTitle !== jobFilter) return false;
      if (!q) return true;
      const hay = [c.candidateName, c.email, c.jobTitle, c.currentRole, ...(c.skills || [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    list = [...list].sort((a, b) => {
      const scoreOf = (c: DashboardCandidate) => {
        if (sortBy === "resume") return c.resumeMatchScore ?? -1;
        if (sortBy === "interview") return c.interviewScore ?? -1;
        return compositeScore(c) ?? -1;
      };
      return scoreOf(b) - scoreOf(a);
    });

    return list.map((c, i) => ({ ...c, displayRank: i + 1 }));
  }, [candidates, jobFilter, query, sortBy]);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Candidate Ranking
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ranked by AI resume match and interview scores — open a profile for full details.
          </p>
        </div>
        <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          {ranked.length} candidate{ranked.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, email, skill, role…"
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="sm:w-48">
          <label className="block text-xs font-medium text-slate-600">Job</label>
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All roles</option>
            {jobs.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-44">
          <label className="block text-xs font-medium text-slate-600">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="composite">Overall fit</option>
            <option value="resume">Resume score</option>
            <option value="interview">Interview score</option>
          </select>
        </div>
      </div>

      {loading && <p className="mt-8 text-sm text-slate-500">Loading rankings…</p>}

      {!loading && ranked.length === 0 && (
        <p className="mt-8 text-sm text-slate-500">
          No candidates to rank yet. Applications appear here after scoring.
        </p>
      )}

      {!loading && top3.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Top candidates
          </h2>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {top3.map((c) => {
              const overall = compositeScore(c);
              const tone = scoreTone(overall);
              const rec = recLabel(c.recommendation);
              return (
                <article
                  key={c.applicationId}
                  className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm ${
                    c.displayRank === 1
                      ? "border-amber-300 ring-2 ring-amber-100"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${
                        c.displayRank === 1
                          ? "bg-amber-500"
                          : c.displayRank === 2
                            ? "bg-slate-500"
                            : "bg-orange-700"
                      }`}
                    >
                      #{c.displayRank}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.chip}`}>
                      {overall != null ? `${overall} overall` : "Unscored"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{c.candidateName}</h3>
                  <p className="text-sm text-slate-600">{c.jobTitle}</p>
                  {c.currentRole && (
                    <p className="mt-1 text-xs text-slate-500">
                      Current: {c.currentRole}
                      {c.yearsOfExperience ? ` · ${c.yearsOfExperience} yrs` : ""}
                    </p>
                  )}
                  <div className="mt-4 space-y-2">
                    <ScoreMeter label="Resume match" score={c.resumeMatchScore} />
                    <ScoreMeter label="AI interview" score={c.interviewScore} />
                  </div>
                  {(c.skills?.length ?? 0) > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {c.skills!.slice(0, 5).map((s) => (
                        <span
                          key={s}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                        >
                          {s}
                        </span>
                      ))}
                      {c.skills!.length > 5 && (
                        <span className="text-[10px] text-slate-400">+{c.skills!.length - 5}</span>
                      )}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {rec && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${rec.className}`}>
                        {rec.label}
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] capitalize text-slate-600">
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/candidates/${c.applicationId}`}
                    className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:underline"
                  >
                    View profile →
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Full ranking
          </h2>
          <ol className="mt-3 space-y-3">
            {rest.map((c) => {
              const overall = compositeScore(c);
              const tone = scoreTone(overall);
              const rec = recLabel(c.recommendation);
              return (
                <li
                  key={c.applicationId}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                        {c.displayRank}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{c.candidateName}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.chip}`}>
                            {overall != null ? `${overall} overall` : "Unscored"}
                          </span>
                          {rec && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${rec.className}`}>
                              {rec.label}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-600">{c.jobTitle}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {c.email}
                          {c.phone ? ` · ${c.phone}` : ""}
                          {c.currentRole ? ` · ${c.currentRole}` : ""}
                          {c.yearsOfExperience
                            ? ` · ${c.yearsOfExperience} yrs exp`
                            : ""}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Applied{" "}
                          {new Date(c.appliedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                          {" · "}
                          <span className="capitalize">{c.status.replace(/_/g, " ")}</span>
                        </p>
                        {(c.skills?.length ?? 0) > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {c.skills!.slice(0, 8).map((s) => (
                              <span
                                key={s}
                                className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full shrink-0 space-y-2 lg:w-56">
                      <ScoreMeter label="Resume match" score={c.resumeMatchScore} />
                      <ScoreMeter label="AI interview" score={c.interviewScore} />
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link
                          href={`/dashboard/candidates/${c.applicationId}`}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Profile
                        </Link>
                        {c.interviewScore != null && (
                          <Link
                            href={`/dashboard/interviews/${c.applicationId}`}
                            className="text-xs font-semibold text-indigo-700 hover:underline"
                          >
                            Interview report
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* When fewer than 4, still show list details for top3 as full list already cards */}
      {!loading && ranked.length > 0 && ranked.length <= 3 && (
        <p className="mt-6 text-center text-xs text-slate-400">
          Showing all ranked candidates above.
        </p>
      )}
    </div>
  );
}
