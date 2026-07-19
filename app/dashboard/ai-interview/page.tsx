import Link from "next/link";
import { listAiInterviewInvites } from "@/lib/ai-interview-invites";
import { COMPANY } from "@/lib/career-site";

export default async function AiInterviewAdminPage() {
  let invites: Awaited<ReturnType<typeof listAiInterviewInvites>> = [];
  let loadError: string | null = null;
  try {
    invites = await listAiInterviewInvites();
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Could not load invites. Run the ai_interview_invites migration.";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        AI Interview Room
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Separate first-stage interviews: invite by secure email link → candidate completes the
        voice room → AI evaluates answers → report lands in Recruiter Admin.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "1. Invite",
            body: "From Candidates, send a personal /ai-interview/[token] link by email.",
          },
          {
            title: "2. Interview",
            body: "Candidate verifies devices + identity, then answers by voice.",
          },
          {
            title: "3. Report",
            body: "Scores and recommendation are emailed to the recruiter and saved here.",
          },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="font-semibold text-slate-900">{c.title}</p>
            <p className="mt-1 text-sm text-slate-600">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard/applicants"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Invite a candidate →
        </Link>
        <Link
          href="/dashboard/email"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Email Center
        </Link>
      </div>

      <section className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 text-sm text-indigo-950">
        <p className="font-semibold">Secure invitation email</p>
        <p className="mt-1 text-indigo-900/90">
          Example link format:{" "}
          <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">
            {COMPANY.name.toLowerCase().replace(/\s+/g, "")}.example/ai-interview/&lt;secure-token&gt;
          </code>
        </p>
        <p className="mt-2 text-indigo-900/90">
          When you click <strong>Invite to AI Interview</strong> on a candidate, the system creates
          a one-time token, emails the candidate (via n8n when configured), and only that
          candidate’s name/email can enter the room before the deadline.
        </p>
      </section>

      {loadError && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {loadError}
        </div>
      )}

      <section className="mt-8">
        <h2 className="font-semibold text-slate-900">Recent invitations</h2>
        {invites.length === 0 && !loadError ? (
          <p className="mt-3 text-sm text-slate-500">No AI interview invitations yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">{inv.candidate_name}</p>
                  <p className="text-xs text-slate-500">
                    {inv.candidate_email} · {inv.job_title}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Deadline{" "}
                    {new Date(inv.deadline).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
                    {inv.status.replace(/_/g, " ")}
                  </span>
                  <p className="mt-2">
                    <Link
                      href={`/dashboard/interviews/${inv.application_id}`}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      View report →
                    </Link>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
