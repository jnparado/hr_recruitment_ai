import Link from "next/link";
import { COMPANY } from "@/lib/career-site";

export default function CompanyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-medium text-indigo-700">{COMPANY.name}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        About the company
      </h1>
      <p className="mt-3 text-lg text-slate-600">{COMPANY.tagline}</p>

      <div className="mt-10 space-y-4 text-base leading-7 text-slate-700">
        {COMPANY.about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-slate-900">What we value</h2>
        <ul className="mt-5 space-y-5">
          {COMPANY.values.map((v) => (
            <li key={v.title} className="border-l-2 border-indigo-300 pl-4">
              <p className="font-semibold text-slate-900">{v.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{v.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-slate-900">Where we work</h2>
        <p className="mt-3 text-sm text-slate-600">
          {COMPANY.locations.join(" · ")}
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Careers contact:{" "}
          <a
            href={`mailto:${COMPANY.contactEmail}`}
            className="font-medium text-indigo-700 hover:underline"
          >
            {COMPANY.contactEmail}
          </a>
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/careers#open-roles"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Browse open roles
        </Link>
        <Link
          href="/careers/track"
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          Track an application
        </Link>
      </div>
    </div>
  );
}
