"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Profile = {
  applicationId: string;
  candidateName: string;
  email: string;
  jobTitle: string;
  status: string;
  resumeMatchScore: number | null;
  rank: number | null;
  interviewScore: number | null;
  recommendation: string | null;
  appliedAt: string;
  resumeUrl?: string;
  notes?: string;
  tags?: string[];
};

export default function CandidateProfilePage() {
  const params = useParams();
  const id = String(params.id || "");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        const c = (d.candidates ?? []).find(
          (x: { applicationId: string }) => x.applicationId === id
        );
        if (!c) throw new Error("Candidate not found.");
        setProfile(c);
        setNotes(c.notes || "");
        setTags((c.tags || []).join(", "));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load."));
  }, [id]);

  async function saveNotes() {
    setSaved(false);
    setError(null);
    try {
      const r = await fetch(`/api/dashboard/applications/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Save failed.");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  if (error && !profile) {
    return <p className="text-sm text-rose-700">{error}</p>;
  }
  if (!profile) {
    return <p className="text-sm text-slate-500">Loading profile…</p>;
  }

  const timeline = [
    { label: "Applied", at: profile.appliedAt },
    profile.resumeMatchScore != null
      ? { label: `Scored ${profile.resumeMatchScore}/100`, at: null }
      : null,
    profile.status === "ai_interview_invited"
      ? { label: "Invited to AI Interview", at: null }
      : null,
    profile.interviewScore != null
      ? { label: `AI interview ${profile.interviewScore}/100`, at: null }
      : null,
    { label: `Status: ${profile.status.replace(/_/g, " ")}`, at: null },
  ].filter(Boolean) as { label: string; at: string | null }[];

  return (
    <div>
      <Link
        href="/dashboard/applicants"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Candidates
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">{profile.candidateName}</h1>
      <p className="text-sm text-slate-600">
        {profile.email} · {profile.jobTitle}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card label="AI resume score" value={profile.resumeMatchScore?.toString() ?? "—"} />
        <Card label="Rank" value={profile.rank?.toString() ?? "—"} />
        <Card
          label="Interview"
          value={
            profile.interviewScore != null
              ? `${profile.interviewScore} (${profile.recommendation || "—"})`
              : "—"
          }
        />
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Resume viewer</h2>
        <p className="mt-2 text-sm text-slate-600">
          Open the stored PDF from Supabase Storage when available.
        </p>
        <Link
          href={`/dashboard/interviews/${id}`}
          className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:underline"
        >
          Interview report / recording →
        </Link>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Application timeline</h2>
        <ol className="mt-3 space-y-2 text-sm text-slate-700">
          {timeline.map((t) => (
            <li key={t.label} className="flex justify-between gap-3 border-b border-slate-100 pb-2">
              <span>{t.label}</span>
              {t.at && (
                <span className="text-xs text-slate-500">
                  {new Date(t.at).toLocaleString()}
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Notes & tags</h2>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
          placeholder="Recruiter notes"
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
          placeholder="Tags (comma-separated)"
        />
        <button
          type="button"
          onClick={() => void saveNotes()}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Save
        </button>
        {saved && <p className="text-sm text-emerald-700">Saved.</p>}
        {error && <p className="text-sm text-rose-700">{error}</p>}
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
