import Link from "next/link";

const AI_FEATURES = [
  {
    title: "Resume parser",
    body: "Extract name, skills, experience, education, and certificates from uploaded PDFs.",
    href: "/screening",
  },
  {
    title: "Candidate ranking",
    body: "Rank applicants by AI match score and interview results.",
    href: "/dashboard/ranking",
  },
  {
    title: "Skill matching",
    body: "Compare resume skills against the job description.",
    href: "/pipeline",
  },
  {
    title: "Missing skills analysis",
    body: "Surface skill gaps with importance for hiring decisions.",
    href: "/screening",
  },
  {
    title: "AI-generated interview questions",
    body: "Role-aware questions in the AI Interview Room and Interview Assistant.",
    href: "/interview",
  },
  {
    title: "Candidate summaries",
    body: "Fit summaries after scoring and full interview evaluation reports.",
    href: "/dashboard/applicants",
  },
  {
    title: "Salary prediction",
    body: "Estimate band from experience signals in pipeline reports (advisory only).",
    href: "/pipeline",
  },
  {
    title: "Duplicate detection",
    body: "Flag repeat applications by email when reviewing candidates.",
    href: "/dashboard/applicants",
  },
  {
    title: "AI Interview Room",
    body: "Invite by secure email link; AI conducts the interview and emails a report to the recruiter.",
    href: "/dashboard/ai-interview",
  },
] as const;

export default function AiFeaturesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Features</h1>
      <p className="mt-1 text-sm text-slate-600">
        Parsing, matching, ranking, and the AI Interview Room — advisory only; humans decide.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {AI_FEATURES.map((f) => (
          <Link
            key={f.title}
            href={f.href}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300"
          >
            <h2 className="font-semibold text-slate-900">{f.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{f.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
