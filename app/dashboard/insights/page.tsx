import Link from "next/link";

export default function InsightsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Insights</h1>
      <p className="mt-1 text-sm text-slate-600">
        Jump into AI tools for deeper screening and interviews.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            href: "/pipeline",
            title: "Recruitment Pipeline",
            text: "Batch extract, match, rank, schedule, report.",
          },
          {
            href: "/screening",
            title: "Resume Screening",
            text: "Score a batch of resumes against a JD.",
          },
          {
            href: "/interview",
            title: "Interview Assistant",
            text: "Run a live AI screening interview.",
          },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm transition hover:border-emerald-400"
          >
            <p className="font-semibold text-slate-900">{c.title}</p>
            <p className="mt-1 text-sm text-slate-600">{c.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
