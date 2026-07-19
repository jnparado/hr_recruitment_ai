import Link from "next/link";
import { JobSearchList } from "@/app/_components/JobSearchList";
import { COMPANY } from "@/lib/career-site";
import { fetchJobs } from "@/lib/jobs";

export default async function CareersPage() {
  const jobs = await fetchJobs();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 px-6 py-14 text-white sm:px-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 80% 60%, rgba(165,180,252,0.4), transparent 35%)",
          }}
        />
        <div className="relative max-w-2xl">
          <p className="text-sm font-medium text-indigo-100">{COMPANY.name}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Careers
          </h1>
          <p className="mt-4 text-lg text-indigo-100">{COMPANY.tagline}</p>
          <p className="mt-3 text-sm text-indigo-200/90">
            Browse open roles, learn about us, apply with your resume, and track your application —
            no account required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#open-roles"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-50"
            >
              Browse jobs
            </a>
            <Link
              href="/careers/company"
              className="rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              About the company
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Browse & search",
            body: "Filter by department or location and find the right fit.",
            href: "#open-roles",
          },
          {
            title: "Apply with resume",
            body: "Upload a PDF and get an email confirmation right away.",
            href: "#open-roles",
          },
          {
            title: "Track status",
            body: "Check where your application stands anytime.",
            href: "/careers/track",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <h2 className="font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
          </Link>
        ))}
      </section>

      <section id="open-roles" className="mt-14 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Open positions</h2>
            <p className="mt-1 text-sm text-slate-600">
              Search and browse current openings at {COMPANY.name}.
            </p>
          </div>
          <Link
            href="/careers/track"
            className="text-sm font-semibold text-indigo-700 hover:underline"
          >
            Already applied? Track status →
          </Link>
        </div>
        <div className="mt-6">
          <JobSearchList jobs={jobs} />
        </div>
      </section>
    </div>
  );
}
