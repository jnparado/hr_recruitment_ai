"use client";

import { useRef, useState } from "react";
import { StorageLink } from "@/app/_components/StorageLink";
import type { ScreeningResult } from "@/lib/types";

const recommendationStyles: Record<
  ScreeningResult["recommendation"],
  { label: string; className: string }
> = {
  strong_match: { label: "Strong match", className: "bg-emerald-100 text-emerald-800" },
  good_match: { label: "Good match", className: "bg-sky-100 text-sky-800" },
  possible_match: { label: "Possible match", className: "bg-amber-100 text-amber-800" },
  not_a_match: { label: "Not a match", className: "bg-rose-100 text-rose-800" },
};

const gapStyles: Record<string, string> = {
  critical: "border-rose-200 bg-rose-50 text-rose-800",
  important: "border-amber-200 bg-amber-50 text-amber-800",
  "nice-to-have": "border-slate-200 bg-slate-50 text-slate-600",
};

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-sky-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}

export default function ScreeningPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScreeningResult[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => {
      const merged = [...prev];
      for (const f of Array.from(list)) {
        if (!merged.some((m) => m.name === f.name && m.size === f.size)) merged.push(f);
      }
      return merged.slice(0, 10);
    });
  }

  async function screen() {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const form = new FormData();
      form.set("jobDescription", jobDescription);
      files.forEach((f) => form.append("resumes", f));
      const res = await fetch("/api/screen", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Screening failed.");
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Resume Screening</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Paste a job description, upload up to 10 resumes, and Grok will rank every
        candidate with match scores, matched skills, and skill gaps.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900">Job description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={12}
            placeholder="Paste the full job description: title, responsibilities, required skills, nice-to-haves…"
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900">
            Resumes <span className="font-normal text-slate-500">(PDF, DOCX, TXT — max 10)</span>
          </label>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
            className="mt-2 flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
          >
            <p className="text-sm font-medium text-slate-700">
              Drop resumes here or <span className="text-indigo-600">browse files</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">Each file is analyzed individually</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((f) => (
                <li
                  key={f.name + f.size}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="truncate text-slate-700">{f.name}</span>
                  <button
                    onClick={() => setFiles((prev) => prev.filter((p) => p !== f))}
                    className="ml-3 shrink-0 text-xs font-medium text-slate-400 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={screen}
            disabled={loading || !jobDescription.trim() || files.length === 0}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading
              ? `Screening ${files.length} resume${files.length > 1 ? "s" : ""}…`
              : "Screen candidates"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-10 flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          <p className="text-sm">Grok is reading resumes and matching them to the role…</p>
        </div>
      )}

      {results && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">
            Ranked candidates ({results.length})
          </h2>
          <div className="mt-4 space-y-4">
            {results.map((r, i) => (
              <article
                key={r.fileName}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                {r.error ? (
                  <div>
                    <p className="font-semibold text-slate-900">{r.fileName}</p>
                    <p className="mt-1 text-sm text-rose-700">Analysis failed: {r.error}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                          {i + 1}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {r.candidateName}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {[r.currentRole, r.yearsOfExperience ? `${r.yearsOfExperience} yrs experience` : "", r.email]
                              .filter(Boolean)
                              .join(" · ") || r.fileName}
                          </p>
                          <div className="mt-1.5">
                            <StorageLink url={r.storageUrl} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${recommendationStyles[r.recommendation]?.className ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {recommendationStyles[r.recommendation]?.label ?? r.recommendation}
                        </span>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${scoreColor(r.matchScore)}`}>
                            {r.matchScore}
                          </div>
                          <div className="text-[10px] uppercase tracking-wide text-slate-400">
                            match score
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-700">{r.summary}</p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Matched skills
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {r.matchedSkills.length > 0 ? (
                            r.matchedSkills.map((s) => (
                              <span
                                key={s}
                                className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">None detected</span>
                          )}
                        </div>
                        {r.strengths.length > 0 && (
                          <>
                            <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Strengths
                            </h4>
                            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                              {r.strengths.map((s) => (
                                <li key={s} className="flex items-start gap-2">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Skill gaps
                        </h4>
                        {r.skillGaps.length > 0 ? (
                          <ul className="mt-2 space-y-2">
                            {r.skillGaps.map((g) => (
                              <li
                                key={g.skill}
                                className={`rounded-lg border px-3 py-2 text-sm ${gapStyles[g.importance] ?? gapStyles["nice-to-have"]}`}
                              >
                                <span className="font-semibold">{g.skill}</span>
                                <span className="ml-2 text-[10px] font-medium uppercase tracking-wide opacity-70">
                                  {g.importance}
                                </span>
                                <p className="mt-0.5 text-xs opacity-90">{g.note}</p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-slate-400">No significant gaps found</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
