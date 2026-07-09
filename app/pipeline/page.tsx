"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { StorageLink } from "@/app/_components/StorageLink";
import type {
  ExtractedResume,
  PipelineResult,
  PipelineStage,
  RankedCandidate,
  RecruiterReport,
} from "@/lib/types";

const PIPELINE_STEPS: { id: PipelineStage; label: string; desc: string }[] = [
  { id: "received", label: "Resume Received", desc: "Upload candidate resumes" },
  { id: "extracting", label: "AI Extracts", desc: "Skills · Experience · Certificates" },
  { id: "matching", label: "Matches Jobs", desc: "Score fit against openings" },
  { id: "ranking", label: "Ranks Candidates", desc: "Order by best match" },
  { id: "scheduling", label: "Schedules Interviews", desc: "Propose interview slots" },
  { id: "report", label: "Recruiter Report", desc: "Executive summary & actions" },
];

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-sky-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}

function StepIndicator({ current, done }: { current: PipelineStage; done: boolean }) {
  const order = PIPELINE_STEPS.map((s) => s.id);
  const currentIdx = done ? order.length : order.indexOf(current);

  return (
    <div className="flex flex-col gap-0 sm:flex-row sm:items-start sm:justify-between">
      {PIPELINE_STEPS.map((step, i) => {
        const isPast = i < currentIdx;
        const isActive = !done && step.id === current;
        return (
          <div key={step.id} className="flex flex-1 items-start gap-0 sm:flex-col sm:items-center">
            <div className="flex items-center sm:flex-col">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                  isPast
                    ? "bg-emerald-500 text-white"
                    : isActive
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {isPast ? "✓" : i + 1}
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div
                  className={`mx-2 hidden h-0.5 flex-1 sm:mx-0 sm:mt-0 sm:block sm:h-8 sm:w-0.5 ${
                    isPast ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
            <div className="ml-3 pb-6 sm:ml-0 sm:mt-2 sm:pb-0 sm:text-center">
              <p
                className={`text-xs font-semibold sm:text-sm ${isActive ? "text-indigo-700" : isPast ? "text-emerald-700" : "text-slate-500"}`}
              >
                {step.label}
              </p>
              <p className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">{step.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExtractionCard({ e }: { e: ExtractedResume }) {
  if (e.error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <p className="font-semibold text-slate-900">{e.fileName}</p>
        <p className="mt-1 text-sm text-rose-700">{e.error}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{e.candidateName}</h3>
          <p className="text-sm text-slate-500">
            {[e.currentRole, e.yearsOfExperience ? `${e.yearsOfExperience} yrs` : "", e.email]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
            {e.fileName}
          </span>
          <StorageLink url={e.storageUrl} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
            Skills
          </h4>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {e.skills.slice(0, 10).map((s) => (
              <span
                key={s}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-800"
              >
                {s}
              </span>
            ))}
            {e.skills.length === 0 && (
              <span className="text-xs text-slate-400">None detected</span>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-sky-600">
            Experience
          </h4>
          <ul className="mt-1.5 space-y-1.5 text-xs text-slate-700">
            {e.experience.slice(0, 3).map((exp) => (
              <li key={`${exp.company}-${exp.role}`}>
                <span className="font-medium">{exp.role}</span>
                <span className="text-slate-500"> @ {exp.company}</span>
                {exp.duration && (
                  <span className="block text-slate-400">{exp.duration}</span>
                )}
              </li>
            ))}
            {e.experience.length === 0 && (
              <li className="text-slate-400">None listed</li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
            Certificates
          </h4>
          <ul className="mt-1.5 space-y-1 text-xs text-slate-700">
            {e.certificates.map((c) => (
              <li key={c.name}>
                <span className="font-medium">{c.name}</span>
                {c.issuer && <span className="text-slate-500"> — {c.issuer}</span>}
                {c.year && <span className="text-slate-400"> ({c.year})</span>}
              </li>
            ))}
            {e.certificates.length === 0 && (
              <li className="text-slate-400">None listed</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function RankedCard({ c }: { c: RankedCandidate }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {c.rank}
          </span>
          <div>
            <h3 className="font-semibold text-slate-900">{c.candidateName}</h3>
            <p className="text-sm text-slate-500">
              Best fit: <span className="font-medium text-slate-700">{c.bestMatch.jobTitle}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${scoreColor(c.bestMatch.matchScore)}`}>
            {c.bestMatch.matchScore}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">match</div>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{c.bestMatch.fitSummary}</p>
      {c.allMatches.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {c.allMatches.map((m) => (
            <span
              key={m.jobId}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
            >
              {m.jobTitle}: {m.matchScore}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportSection({ report }: { report: RecruiterReport }) {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Recruiter Report</h2>
          <p className="text-sm text-slate-500">
            {report.primaryJobTitle} · {report.qualifiedCount}/{report.totalResumes} qualified ·{" "}
            {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => {
            const text = [
              `RECRUITER REPORT — ${report.primaryJobTitle}`,
              `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
              `Qualified: ${report.qualifiedCount}/${report.totalResumes}`,
              "",
              "EXECUTIVE SUMMARY",
              report.executiveSummary,
              "",
              "TOP CANDIDATES",
              ...report.topCandidates.map(
                (c) =>
                  `#${c.rank} ${c.name} — ${c.score}/100 (${c.recommendation}): ${c.keyStrength}`
              ),
              "",
              "INTERVIEW SCHEDULE",
              ...report.interviewSchedule.map(
                (s) =>
                  `${s.candidateName}: ${s.proposedDate} ${s.proposedTime} (${s.format}, ${s.durationMinutes}min) — ${s.jobTitle}`
              ),
              "",
              "ACTION ITEMS",
              ...report.actionItems.map((a) => `• ${a}`),
              "",
              "RISK FLAGS",
              ...(report.riskFlags.length
                ? report.riskFlags.map((r) => `⚠ ${r}`)
                : ["None"]),
            ].join("\n");
            void navigator.clipboard.writeText(text);
          }}
          className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
        >
          Copy report
        </button>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700">{report.executiveSummary}</p>

      {report.topCandidates.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Top candidates
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="pb-2 pr-4">Rank</th>
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Score</th>
                  <th className="pb-2 pr-4">Recommendation</th>
                  <th className="pb-2">Key strength</th>
                </tr>
              </thead>
              <tbody>
                {report.topCandidates.map((c) => (
                  <tr key={c.name} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium">{c.rank}</td>
                    <td className="py-2 pr-4">{c.name}</td>
                    <td className={`py-2 pr-4 font-semibold ${scoreColor(c.score)}`}>
                      {c.score}
                    </td>
                    <td className="py-2 pr-4">{c.recommendation}</td>
                    <td className="py-2 text-slate-600">{c.keyStrength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {report.interviewSchedule.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Scheduled interviews
          </h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {report.interviewSchedule.map((s) => (
              <div
                key={`${s.candidateName}-${s.proposedDate}-${s.proposedTime}`}
                className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
              >
                <p className="font-semibold text-slate-900">{s.candidateName}</p>
                <p className="text-slate-600">
                  {s.proposedDate} · {s.proposedTime} · {s.format} · {s.durationMinutes} min
                </p>
                <p className="text-xs text-slate-500">{s.jobTitle}</p>
                {s.notes && <p className="mt-1 text-xs text-slate-400">{s.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Action items
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
            {report.actionItems.map((a) => (
              <li key={a} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                {a}
              </li>
            ))}
          </ul>
        </div>
        {report.riskFlags.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-500">
              Risk flags
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-rose-700">
              {report.riskFlags.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">⚠</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [jobs, setJobs] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<PipelineStage>("received");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
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

  async function runPipeline() {
    setLoading(true);
    setError(null);
    setResult(null);
    setStage("received");

    const stages: PipelineStage[] = [
      "extracting",
      "matching",
      "ranking",
      "scheduling",
      "report",
    ];
    let stageIdx = 0;
    const timer = setInterval(() => {
      if (stageIdx < stages.length) {
        setStage(stages[stageIdx]);
        stageIdx++;
      }
    }, 3500);

    try {
      const form = new FormData();
      form.set("jobs", jobs);
      files.forEach((f) => form.append("resumes", f));
      const res = await fetch("/api/pipeline", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pipeline failed.");
      setResult(data);
      setStage("report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStage("received");
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Recruitment Pipeline
      </h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        End-to-end hiring automation: receive resumes, extract skills and credentials,
        match to jobs, rank candidates, schedule interviews, and generate a recruiter report.
      </p>

      {/* Pipeline flow diagram */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <StepIndicator current={stage} done={!!result && !loading} />
      </div>

      {/* Input */}
      {!result && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-900">
              Job opening(s)
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Paste one job description, or a JSON array for multiple roles.
            </p>
            <textarea
              value={jobs}
              onChange={(e) => setJobs(e.target.value)}
              rows={12}
              placeholder={`Single job:\nSenior Software Engineer\n\nRequirements:\n- 5+ years Python...\n\n---\n\nMultiple jobs (JSON):\n[{"id":"fe","title":"Frontend Dev","description":"React, TypeScript..."},{"id":"be","title":"Backend Dev","description":"Python, AWS..."}]`}
              className="mt-2 w-full resize-y rounded-xl border border-slate-300 p-3 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
                      className="ml-3 shrink-0 text-xs text-slate-400 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={runPipeline}
              disabled={loading || !jobs.trim() || files.length === 0}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Running pipeline…" : "Run recruitment pipeline"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-10 flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          <p className="text-sm">
            {PIPELINE_STEPS.find((s) => s.id === stage)?.label ?? "Processing"}…
          </p>
        </div>
      )}

      {result && (
        <div className="mt-10 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Pipeline complete</h2>
            <button
              onClick={() => {
                setResult(null);
                setStage("received");
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Run again
            </button>
          </div>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs">
                1
              </span>
              Resume Received — Stored in Supabase
            </h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {result.stored.map((s) => (
                <div
                  key={s.fileName + s.storagePath}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <span className="truncate font-medium text-slate-800">{s.fileName}</span>
                  {s.error ? (
                    <span className="ml-2 shrink-0 text-xs text-rose-600">{s.error}</span>
                  ) : (
                    <StorageLink url={s.storageUrl} label="Open file" />
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-indigo-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs">
                2
              </span>
              AI Extracted — Skills · Experience · Certificates
            </h3>
            <div className="mt-4 space-y-4">
              {result.extractions.map((e) => (
                <ExtractionCard key={e.fileName} e={e} />
              ))}
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sky-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-xs">
                3–4
              </span>
              Matched & Ranked Candidates
            </h3>
            <div className="mt-4 space-y-3">
              {result.ranked.map((c) => (
                <RankedCard key={c.fileName} c={c} />
              ))}
              {result.ranked.length === 0 && (
                <p className="text-sm text-slate-500">No candidates could be ranked.</p>
              )}
            </div>
          </section>

          {result.schedule.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs">
                  5
                </span>
                Interview Schedule
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {result.schedule.map((s) => (
                  <div
                    key={`${s.candidateName}-${s.proposedDate}`}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">{s.candidateName}</p>
                    <p className="mt-1 text-sm text-emerald-800">
                      {s.proposedDate} · {s.proposedTime}
                    </p>
                    <p className="text-xs text-slate-600">
                      {s.format} · {s.durationMinutes} min · {s.jobTitle}
                    </p>
                    {s.candidateEmail && (
                      <p className="mt-1 text-xs text-slate-500">{s.candidateEmail}</p>
                    )}
                    <Link
                      href={`/interview?candidate=${encodeURIComponent(s.candidateName)}&job=${encodeURIComponent(s.jobTitle)}`}
                      className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Run AI interview →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs">
                6
              </span>
              Recruiter Report
            </h3>
            <div className="mt-4">
              <ReportSection report={result.report} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
