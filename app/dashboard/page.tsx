import Link from "next/link";
import { RecruiterDecisionFlow } from "@/app/_components/RecruiterDecisionFlow";
import { RECRUITER_MODULES } from "@/app/_components/RecruiterShell";

export default function DashboardHomePage() {
  const modules = RECRUITER_MODULES.filter((m) => m.href !== "/dashboard");

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Recruiter Dashboard
          </h1>
          <p className="mt-2 text-slate-600">
            Login → manage job posts, applicants, ranking, schedules, and outreach.
          </p>
        </div>
        <Link
          href="/dashboard/applicants"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          View applicants →
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <p className="font-semibold text-slate-900">{m.label}</p>
            <p className="mt-1 text-xs text-slate-500">Open module</p>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <RecruiterDecisionFlow />
      </div>
    </div>
  );
}
