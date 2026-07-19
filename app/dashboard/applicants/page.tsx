"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function ApplicantsPage() {
  const [candidates, setCandidates] = useState<DashboardCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00 AM");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/dashboard");
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d.error || "Failed to load applicants.");
      setCandidates(d.candidates ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applicants.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(
    applicationId: string,
    action: "shortlist" | "reject" | "schedule",
    extra?: Record<string, string | number>
  ) {
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

      if (action === "schedule") {
        setScheduleFor(null);
      }

      setCandidates((prev) =>
        prev.map((c) =>
          c.applicationId === applicationId
            ? { ...c, status: d.status || c.status }
            : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function scoreResume(applicationId: string) {
    setBusyId(applicationId);
    try {
      const r = await fetch(`/api/applications/${applicationId}/score`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Scoring failed.");
      setCandidates((prev) =>
        prev.map((c) =>
          c.applicationId === applicationId
            ? { ...c, resumeMatchScore: d.matchScore, status: "scored" }
            : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scoring failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function inviteAiInterview(applicationId: string) {
    setBusyId(applicationId);
    setError(null);
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
        alert(
          [
            d.emailNote || "AI Interview invitation created.",
            "",
            `Secure link:`,
            d.interviewUrl,
            "",
            d.emailSent
              ? `Email sent to ${d.email?.to || "candidate"}.`
              : `Email payload ready for ${d.email?.to || "candidate"} (configure N8N_WEBHOOK_URL to deliver).`,
            "",
            "Link copied to clipboard when allowed.",
          ].join("\n")
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Candidate Management
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            View applicants, AI scores, invite to AI Interview Room, then shortlist / reject /
            schedule a human interview.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading && <p className="mt-6 text-sm text-slate-500">Loading applicants…</p>}

      {!loading && candidates.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">
          No applicants yet. Candidates apply on the public Career Website.
        </p>
      )}

      {candidates.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Resume</th>
                <th className="px-4 py-3">Interview</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.applicationId} className="border-b border-slate-100 align-top">
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
                    {c.resumeMatchScore != null ? `${c.resumeMatchScore}/100` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${scoreClass(c.interviewScore)}`}>
                      {c.interviewScore != null ? `${c.interviewScore}/100` : "—"}
                    </span>
                    {c.recommendation && (
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${recBadge(c.recommendation)}`}
                      >
                        {c.recommendation}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <Link
                        href={`/dashboard/candidates/${c.applicationId}`}
                        className="text-left text-xs font-semibold text-slate-700 hover:underline"
                      >
                        Open profile
                      </Link>
                      {c.resumeMatchScore == null && (
                        <button
                          type="button"
                          disabled={busyId === c.applicationId}
                          onClick={() => void scoreResume(c.applicationId)}
                          className="text-left text-xs font-semibold text-slate-600 hover:underline disabled:opacity-50"
                        >
                          Score resume
                        </button>
                      )}
                      {c.status !== "rejected" && (
                        <button
                          type="button"
                          disabled={busyId === c.applicationId}
                          onClick={() => void inviteAiInterview(c.applicationId)}
                          className="text-left text-xs font-semibold text-indigo-700 hover:underline disabled:opacity-50"
                        >
                          Invite to AI Interview
                        </button>
                      )}
                      {c.status !== "rejected" && c.status !== "shortlisted" && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === c.applicationId}
                            onClick={() => void decide(c.applicationId, "shortlist")}
                            className="text-left text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50"
                          >
                            Shortlist
                          </button>
                          <button
                            type="button"
                            disabled={busyId === c.applicationId}
                            onClick={() => void decide(c.applicationId, "reject")}
                            className="text-left text-xs font-semibold text-rose-700 hover:underline disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(c.status === "shortlisted" ||
                        c.status === "scored" ||
                        c.status === "interview_completed" ||
                        c.interviewScore != null) && (
                        <button
                          type="button"
                          onClick={() => {
                            setScheduleFor(c.applicationId);
                            const d = new Date();
                            d.setDate(d.getDate() + 2);
                            setScheduleDate(d.toISOString().slice(0, 10));
                          }}
                          className="text-left text-xs font-semibold text-indigo-700 hover:underline"
                        >
                          Human interview
                        </button>
                      )}
                      {c.interviewScore != null && (
                        <Link
                          href={`/dashboard/interviews/${c.applicationId}`}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Interview report →
                        </Link>
                      )}
                      {scheduleFor === c.applicationId && (
                        <div className="mt-1 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                          <input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                          <input
                            type="text"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                            placeholder="10:00 AM"
                          />
                          <button
                            type="button"
                            disabled={busyId === c.applicationId || !scheduleDate}
                            onClick={() =>
                              void decide(c.applicationId, "schedule", {
                                scheduledDate: scheduleDate,
                                scheduledTime: scheduleTime,
                              })
                            }
                            className="w-full rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Confirm · Calendar · Email · Reminder
                          </button>
                        </div>
                      )}
                    </div>
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
