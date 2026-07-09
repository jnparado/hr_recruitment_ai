import Link from "next/link";

const pipelineSteps = [
  "Resume Received",
  "AI Extracts",
  "Matches Jobs",
  "Ranks Candidates",
  "Schedules Interviews",
  "Recruiter Report",
];

const features = [
  {
    href: "/pipeline",
    title: "Recruitment Pipeline",
    description:
      "The full hiring workflow in one run — from resume intake through extraction, job matching, ranking, interview scheduling, and a recruiter report.",
    bullets: [
      "Extract skills, experience & certificates",
      "Match & rank against job openings",
      "Auto-schedule qualified candidates",
      "Generate executive recruiter report",
    ],
    cta: "Run pipeline",
    primary: true,
  },
  {
    href: "/screening",
    title: "AI Resume Screening",
    description:
      "Upload a batch of resumes against a job description. Grok reads every resume, scores the match, ranks candidates, and flags skill gaps.",
    bullets: ["Reads PDF, DOCX & TXT resumes", "Matches job descriptions", "Ranks candidates 0–100", "Detects critical skill gaps"],
    cta: "Screen resumes",
  },
  {
    href: "/interview",
    title: "AI Interview Assistant",
    description:
      "Grok conducts the first screening interview by voice or text — one question at a time — then delivers a candidate score and a clear hire recommendation.",
    bullets: ["Real voice interviews (Grok TTS + STT)", "Experience & skills deep-dive", "Salary expectations & availability", "Score + advance/reject call"],
    cta: "Start an interview",
  },
];

const audiences = [
  { title: "Recruitment agencies", text: "Screen hundreds of applicants per role without adding headcount." },
  { title: "HR teams", text: "Give hiring managers a ranked shortlist and interview notes on day one." },
  { title: "Job marketplaces", text: "Embed instant candidate–job matching and automated screening." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          Powered by Grok · xAI
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Recruitment on autopilot
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          HR Process runs the full hiring pipeline — receive resumes, extract credentials,
          match jobs, rank candidates, schedule interviews, and deliver recruiter reports.
        </p>
        <Link
          href="/pipeline"
          className="mt-6 inline-flex items-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Start recruitment pipeline →
        </Link>
      </section>

      {/* Pipeline flow */}
      <section className="mt-14">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
          How it works
        </h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
          {pipelineSteps.map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm">
                {step}
              </span>
              {i < pipelineSteps.length - 1 && (
                <span className="text-slate-300">↓</span>
              )}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.href}
            className={`flex flex-col rounded-2xl border p-7 shadow-sm transition hover:shadow-md ${
              f.primary
                ? "border-indigo-300 bg-gradient-to-br from-indigo-50 to-white ring-1 ring-indigo-200"
                : "border-slate-200 bg-white"
            }`}
          >
            <h2 className="text-xl font-semibold text-slate-900">{f.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{f.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {f.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  {b}
                </li>
              ))}
            </ul>
            <Link
              href={f.href}
              className={`mt-6 inline-flex w-fit items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                f.primary
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {f.cta} →
            </Link>
          </div>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
          Built for
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {audiences.map((a) => (
            <div key={a.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">{a.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{a.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
