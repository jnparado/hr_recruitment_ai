import Link from "next/link";
import { CareerWebsiteFlow } from "@/app/_components/CareerWebsiteFlow";
import { RecruiterDecisionFlow } from "@/app/_components/RecruiterDecisionFlow";
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
          A public Career Website for applicants, and private recruiter tools for scoring,
          ranking, and interviews.
        </p>
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-7 shadow-sm">
          <span className="inline-flex rounded-full border border-indigo-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
            Public
          </span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Career Website</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            For applicants and candidates. No login. Browse open roles, upload a PDF resume,
            and the automation pipeline parses, scores, ranks, and notifies recruiters.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {[
              "Apply for a job + PDF resume upload",
              "Supabase storage & database record",
              "n8n trigger + AI resume parsing",
              "Match JD → score → rank → notify recruiter",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                {b}
              </li>
            ))}
          </ul>
          <Link
            href="/careers"
            className="mt-6 inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Open Career Website →
          </Link>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-7 shadow-sm">
          <span className="inline-flex rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Recruiter only
          </span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Recruiter tools</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Login required. Dashboard scores, pipeline, screening, interview assistant, and
            listen to voice interviews.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {[
              "Dashboard with resume & interview scores",
              "Full recruitment pipeline",
              "Batch resume screening",
              "AI interview + recording review",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {b}
              </li>
            ))}
          </ul>
          <Link
            href={recruiter ? "/dashboard" : "/login"}
            className="mt-6 inline-flex items-center rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
          >
            {recruiter ? "Open dashboard →" : "Recruiter login →"}
          </Link>
        </div>
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-2">
        <CareerWebsiteFlow />
        <RecruiterDecisionFlow />
      </section>
    </div>
  );
}
