import Link from "next/link";

const features = [
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
      "Grok conducts the first screening interview — one question at a time — then delivers a candidate score and a clear hire recommendation.",
    bullets: ["Experience & skills deep-dive", "Salary expectations", "Availability & notice period", "Score + advance/reject call"],
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
          HR Process screens resumes, ranks candidates, and runs first-round
          interviews — so your team only spends time on the people worth meeting.
        </p>
      </section>

      <section className="mt-14 grid gap-6 md:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.href}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-md"
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
              className="mt-6 inline-flex w-fit items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
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
