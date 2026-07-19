import Link from "next/link";
import { notFound } from "next/navigation";
import { CareerApplyForm } from "@/app/_components/CareerApplyForm";
import { resolveJob } from "@/lib/jobs";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await resolveJob(id);
  if (!job) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/careers#open-roles"
        className="text-sm font-medium text-indigo-700 hover:underline"
      >
        ← All open roles
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <article>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded bg-slate-100 px-2 py-0.5">{job.department}</span>
            <span className="rounded bg-slate-100 px-2 py-0.5">{job.location}</span>
            <span className="rounded bg-slate-100 px-2 py-0.5">{job.type}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {job.title}
          </h1>
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              About the role
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700 whitespace-pre-wrap">
              {job.description}
            </p>
          </section>
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Requirements
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700 whitespace-pre-wrap">
              {job.requirements}
            </p>
          </section>
        </article>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Apply for this role</h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload your PDF resume. You’ll get a confirmation email and can track status anytime.
            </p>
            <div className="mt-5">
              <CareerApplyForm job={job} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
