import Link from "next/link";
import { getRecruiter } from "@/lib/auth";

export default async function Home() {
  const recruiter = await getRecruiter();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          Powered by Cursor
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Recruitment on autopilot
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Public Career Website for candidates, Recruiter Admin after login, and a secure AI
          Interview Room for first-stage screening.
        </p>
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-7 shadow-sm">
          <span className="inline-flex rounded-full border border-indigo-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
            Public
          </span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Career Website</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Browse jobs, apply with a resume, track status — no login.
          </p>
          <Link
            href="/careers"
            className="mt-6 inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Open Career Website →
          </Link>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-7 shadow-sm">
          <span className="inline-flex rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Recruiter Admin
          </span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Internal dashboard</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Jobs, candidates, AI features, interviews, email, and analytics — login required.
          </p>
          <Link
            href={recruiter ? "/dashboard" : "/login"}
            className="mt-6 inline-flex items-center rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
          >
            {recruiter ? "Open Recruiter Admin →" : "Recruiter login →"}
          </Link>
        </div>
      </section>
    </div>
  );
}
