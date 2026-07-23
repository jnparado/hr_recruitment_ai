"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { scoreAllUnscored } from "@/app/dashboard/_lib/score-unscored";
import type { DashboardCandidate } from "@/lib/types";

function scoreTone(score: number | null) {
  if (score == null)
    return { text: "text-slate-400", bar: "bg-slate-200", chip: "bg-slate-100 text-slate-600" };
  if (score >= 70)
    return { text: "text-emerald-700", bar: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-800" };
  if (score >= 45)
    return { text: "text-amber-700", bar: "bg-amber-500", chip: "bg-amber-100 text-amber-900" };
  return { text: "text-rose-700", bar: "bg-rose-500", chip: "bg-rose-100 text-rose-800" };
}

function statusChip(status: string) {
  const s = normalizeStatus(status);
  if (s === "shortlisted") return "bg-emerald-100 text-emerald-800";
  if (s === "rejected") return "bg-rose-100 text-rose-800";
  if (s.includes("interview")) return "bg-indigo-100 text-indigo-800";
  if (s === "scored" || s === "parsed") return "bg-sky-100 text-sky-800";
  return "bg-slate-100 text-slate-600";
}

function normalizeStatus(status: string | null | undefined) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isRejected(status: string | null | undefined) {
  const s = normalizeStatus(status);
  return s === "rejected" || s === "reject";
}

function ScoreMeter({
  label,
  score,
  emptyLabel = "—",
}: {
  label: string;
  score: number | null;
  emptyLabel?: string;
}) {
  const tone = scoreTone(score);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className={`font-semibold ${tone.text}`}>
          {score != null ? `${score}/100` : emptyLabel}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${tone.bar}`}
          style={{ width: `${score != null ? score : 0}%` }}
        />
      </div>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
  tone = "neutral",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "neutral" | "primary" | "success" | "danger" | "indigo";
}) {
  const styles = {
    neutral: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    primary: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    success: "border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-500",
    danger: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
  }[tone];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  );
}

export default function ApplicantsPage() {
  const [candidates, setCandidates] = useState<DashboardCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [scoreNote, setScoreNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00 AM");
  const [query, setQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [inviteResult, setInviteResult] = useState<{
    interviewUrl: string;
    emailTo: string;
    emailSent: boolean;
    emailNote: string;
    candidateName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const autoScoreStarted = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    const r = await fetch("/api/dashboard");
    const d = await r.json();
    if (!r.ok || d.error) throw new Error(d.error || "Failed to load applicants.");
    setCandidates(d.candidates ?? []);
    return (d.candidates ?? []) as DashboardCandidate[];
  }, []);

  const runScoring = useCallback(async () => {
    setScoring(true);
    setError(null);
    setScoreNote("Scoring unscored resumes with AI…");
    try {
      const { totalScored, last } = await scoreAllUnscored(async () => {
        await load();
      });
      await load();
      if (totalScored > 0) {
        setScoreNote(`Scored ${totalScored} resume${totalScored === 1 ? "" : "s"}.`);
      } else if ((last.attempted ?? 0) > 0) {
        const firstErr = last.results?.find((x) => x.error)?.error;
        setError(
          firstErr ||
            "Could not score resumes. Check CURSOR_API_KEY / OPENAI_API_KEY and resume files."
        );
        setScoreNote(null);
      } else {
        setScoreNote(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scoring failed.");
      setScoreNote(null);
    } finally {
      setScoring(false);
    }
  }, [load]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const list = await load();
        const needsScore = list.some(
          (c) => c.resumeMatchScore == null && !isRejected(c.status)
        );
        if (needsScore && !autoScoreStarted.current) {
          autoScoreStarted.current = true;
          await runScoring();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load applicants.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load, runScoring]);

  const jobs = useMemo(
    () => [...new Set(candidates.map((c) => c.jobTitle).filter(Boolean))].sort(),
    [candidates]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter((c) => {
      const status = normalizeStatus(c.status);
      if (statusFilter === "active" && isRejected(status)) return false;
      if (statusFilter === "rejected" && !isRejected(status)) return false;
      if (
        statusFilter !== "all" &&
        statusFilter !== "active" &&
        statusFilter !== "rejected" &&
        status !== normalizeStatus(statusFilter)
      ) {
        return false;
      }
      if (jobFilter !== "all" && c.jobTitle !== jobFilter) return false;
      if (!q) return true;
      const hay = [c.candidateName, c.email, c.jobTitle, c.currentRole, ...(c.skills || [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [candidates, jobFilter, statusFilter, query]);

  const stats = useMemo(() => {
    const active = candidates.filter((c) => !isRejected(c.status));
    return {
      total: active.length,
      scored: active.filter((c) => c.resumeMatchScore != null).length,
      shortlisted: active.filter((c) => normalizeStatus(c.status) === "shortlisted").length,
      interviewed: active.filter((c) => c.interviewScore != null).length,
      rejected: candidates.filter((c) => isRejected(c.status)).length,
    };
  }, [candidates]);

  async function decide(
    applicationId: string,
    action: "shortlist" | "reject" | "schedule",
    extra?: Record<string, string | number>
  ) {
    if (action === "reject") {
      const name =
        candidates.find((c) => c.applicationId === applicationId)?.candidateName ||
        "this candidate";
      if (!window.confirm(`Reject ${name}? They will move out of the Active list.`)) {
        return;
      }
    }

    setBusyId(applicationId);
    setError(null);
    try {
      const r = await fetch(`/api/dashboard/applications/${applicationId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Action failed.");
      if (action === "schedule") setScheduleFor(null);

      const nextStatus =
        action === "reject"
          ? "rejected"
          : action === "shortlist"
            ? "shortlisted"
            : d.status || "interview_scheduled";

      setCandidates((prev) =>
        prev.map((c) =>
          c.applicationId === applicationId ? { ...c, status: nextStatus } : c
        )
      );

      // Keep Active view — rejected cards disappear immediately
      if (action === "reject" && statusFilter === "active") {
        // status already updated; filter hides them
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function scoreResume(applicationId: string) {
    setBusyId(applicationId);
    setError(null);
    try {
      const r = await fetch(`/api/applications/${applicationId}/score`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Scoring failed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scoring failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function inviteAiInterview(applicationId: string) {
    setBusyId(applicationId);
    setError(null);
    setCopied(false);
    const candidate = candidates.find((c) => c.applicationId === applicationId);
    try {
      const r = await fetch(`/api/dashboard/applications/${applicationId}/invite-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Invite failed.");
      setCandidates((prev) =>
        prev.map((c) =>
          c.applicationId === applicationId
            ? { ...c, status: "ai_interview_invited" }
            : c
        )
      );
      if (d.interviewUrl) {
        await navigator.clipboard.writeText(d.interviewUrl).catch(() => null);
        setCopied(true);
        setInviteResult({
          interviewUrl: d.interviewUrl,
          emailTo: d.email?.to || candidate?.email || "candidate",
          emailSent: !!d.emailSent,
          emailNote: d.emailNote || "Invitation created.",
          candidateName: candidate?.candidateName || "Candidate",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function copyInviteLink() {
    if (!inviteResult?.interviewUrl) return;
    try {
      await navigator.clipboard.writeText(inviteResult.interviewUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function openSchedule(applicationId: string) {
    setScheduleFor(applicationId);
    const d = new Date();
    d.setDate(d.getDate() + 2);
    setScheduleDate(d.toISOString().slice(0, 10));
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Candidate Management
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review applicants, run AI scores, invite to the AI Interview Room, then shortlist,
            reject, or schedule a human interview.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={scoring || loading}
            onClick={() => void runScoring()}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100 disabled:opacity-50"
          >
            {scoring ? "Scoring…" : "Score unscored resumes"}
          </button>
          <button
            type="button"
            onClick={() =>
              void (async () => {
                setLoading(true);
                try {
                  await load();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to load.");
                } finally {
                  setLoading(false);
                }
              })()
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {(scoreNote || error) && (
        <p
          className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-sky-200 bg-sky-50 text-sky-900"
          }`}
        >
          {error || scoreNote}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(
          [
            { label: "Active", value: stats.total, filter: "active" },
            { label: "AI scored", value: stats.scored, filter: "active" },
            { label: "Interviewed", value: stats.interviewed, filter: "active" },
            { label: "Shortlisted", value: stats.shortlisted, filter: "shortlisted" },
            { label: "Rejected", value: stats.rejected, filter: "rejected" },
          ] as const
        ).map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setStatusFilter(s.filter)}
            className={`rounded-xl border px-4 py-3 text-left shadow-sm transition ${
              statusFilter === s.filter
                ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200"
                : "border-slate-200 bg-white hover:border-emerald-200"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
          </button>
        ))}
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
          <label className="block text-xs font-medium text-slate-600">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="active">Active (hide rejected)</option>
            <option value="rejected">Rejected only</option>
            <option value="all">All statuses</option>
            {[...new Set(candidates.map((c) => normalizeStatus(c.status)))]
              .filter((s) => s && !isRejected(s) && s !== "shortlisted")
              .map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            <option value="shortlisted">shortlisted</option>
          </select>
        </div>
      </div>

      {loading && <p className="mt-8 text-sm text-slate-500">Loading applicants…</p>}

      {!loading && filtered.length === 0 && (
        <p className="mt-8 text-sm text-slate-500">
          {candidates.length === 0
            ? "No applicants yet. Candidates apply on the public Career Website."
            : "No applicants match your filters."}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {filtered.map((c) => {
          const busy = busyId === c.applicationId;
          const resumeTone = scoreTone(c.resumeMatchScore);
          return (
            <article
              key={c.applicationId}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200"
            >
              <div className="grid gap-5 p-5 lg:grid-cols-[1fr_220px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">
                          {c.candidateName}
                        </h2>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusChip(c.status)}`}
                        >
                          {c.status.replace(/_/g, " ")}
                        </span>
                        {c.rank != null && (
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Rank #{c.rank}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-700">{c.jobTitle}</p>
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
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${resumeTone.chip}`}>
                      Resume {c.resumeMatchScore != null ? `${c.resumeMatchScore}` : "—"}
                    </span>
                  </div>

                  {(c.skills?.length ?? 0) > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {c.skills!.slice(0, 8).map((s) => (
                        <span
                          key={s}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                        >
                          {s}
                        </span>
                      ))}
                      {c.skills!.length > 8 && (
                        <span className="text-[10px] text-slate-400">
                          +{c.skills!.length - 8} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/candidates/${c.applicationId}`}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Open profile
                    </Link>
                    {c.resumeMatchScore == null && (
                      <ActionBtn
                        disabled={busy}
                        tone="neutral"
                        onClick={() => void scoreResume(c.applicationId)}
                      >
                        {busy ? "Scoring…" : "Score resume"}
                      </ActionBtn>
                    )}
                    {!isRejected(c.status) && (
                      <ActionBtn
                        disabled={busy}
                        tone="indigo"
                        onClick={() => void inviteAiInterview(c.applicationId)}
                      >
                        Invite to AI Interview
                      </ActionBtn>
                    )}
                    {!isRejected(c.status) &&
                      normalizeStatus(c.status) !== "shortlisted" && (
                      <>
                        <ActionBtn
                          disabled={busy}
                          tone="success"
                          onClick={() => void decide(c.applicationId, "shortlist")}
                        >
                          Shortlist
                        </ActionBtn>
                        <ActionBtn
                          disabled={busy}
                          tone="danger"
                          onClick={() => void decide(c.applicationId, "reject")}
                        >
                          Reject
                        </ActionBtn>
                      </>
                    )}
                    {(normalizeStatus(c.status) === "shortlisted" ||
                      normalizeStatus(c.status) === "scored" ||
                      normalizeStatus(c.status) === "ai_interview_invited" ||
                      c.interviewScore != null) &&
                      !isRejected(c.status) && (
                        <ActionBtn
                          disabled={busy}
                          tone="primary"
                          onClick={() => openSchedule(c.applicationId)}
                        >
                          Schedule human interview
                        </ActionBtn>
                      )}
                    {c.interviewScore != null && (
                      <Link
                        href={`/dashboard/interviews/${c.applicationId}`}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        Interview report
                      </Link>
                    )}
                  </div>

                  {scheduleFor === c.applicationId && (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                      <p className="text-xs font-semibold text-emerald-900">
                        Schedule human interview
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          placeholder="10:00 AM"
                          className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                        />
                        <ActionBtn
                          disabled={busy || !scheduleDate}
                          tone="success"
                          onClick={() =>
                            void decide(c.applicationId, "schedule", {
                              scheduledDate: scheduleDate,
                              scheduledTime: scheduleTime,
                            })
                          }
                        >
                          Confirm · Calendar · Email · Reminder
                        </ActionBtn>
                        <ActionBtn tone="neutral" onClick={() => setScheduleFor(null)}>
                          Cancel
                        </ActionBtn>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    AI scores
                  </p>
                  <ScoreMeter
                    label="Resume match"
                    score={c.resumeMatchScore}
                    emptyLabel={scoring || busyId === c.applicationId ? "…" : "—"}
                  />
                  <ScoreMeter
                    label="AI interview"
                    score={c.interviewScore}
                    emptyLabel="Pending"
                  />
                  {c.recommendation && (
                    <p className="text-xs text-slate-600">
                      Recommendation:{" "}
                      <span className="font-semibold capitalize text-slate-900">
                        {c.recommendation.replace(/_/g, " ")}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {inviteResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-dialog-title"
          onClick={() => setInviteResult(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              AI Interview invite
            </p>
            <h2 id="invite-dialog-title" className="mt-1 text-xl font-bold text-slate-900">
              {inviteResult.emailSent ? "Email sent" : "Invite ready"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Secure meeting link for{" "}
              <span className="font-medium text-slate-900">{inviteResult.candidateName}</span>
              {inviteResult.emailSent ? (
                <>
                  {" "}
                  was emailed to{" "}
                  <span className="font-medium text-slate-900">{inviteResult.emailTo}</span>.
                </>
              ) : (
                <>
                  . Email was not sent automatically — copy the link and share it with{" "}
                  <span className="font-medium text-slate-900">{inviteResult.emailTo}</span>.
                </>
              )}
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Secure link
              </p>
              <p className="mt-1 break-all font-mono text-xs text-slate-800">
                {inviteResult.interviewUrl}
              </p>
            </div>

            {!inviteResult.emailSent && (
              <p className="mt-3 text-xs text-amber-800">
                To auto-send invites on Vercel, add{" "}
                <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> (or{" "}
                <code className="rounded bg-amber-100 px-1">N8N_WEBHOOK_URL</code>) in project
                env vars.
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyInviteLink()}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                {copied ? "Copied" : "Copy link"}
              </button>
              <a
                href={`mailto:${encodeURIComponent(inviteResult.emailTo)}?subject=${encodeURIComponent(
                  "Your AI Interview invitation"
                )}&body=${encodeURIComponent(
                  `Hi,\n\nPlease complete your AI interview using this secure link:\n\n${inviteResult.interviewUrl}\n\nThank you.`
                )}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open email app
              </a>
              <button
                type="button"
                onClick={() => setInviteResult(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
