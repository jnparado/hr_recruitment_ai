import Link from "next/link";
import { getRecruiter } from "@/lib/auth";

export async function SiteHeader() {
  const recruiter = await getRecruiter();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            H
          </span>
          HR Process
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium text-slate-600">
          <span className="hidden px-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 sm:inline">
            Candidate
          </span>
          <Link
            href="/careers"
            className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Careers
          </Link>

          {recruiter ? (
            <>
              <span className="mx-1 hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
              <span className="hidden px-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 sm:inline">
                Recruiter
              </span>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Dashboard
              </Link>
              <Link
                href="/pipeline"
                className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Pipeline
              </Link>
              <Link
                href="/screening"
                className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Screening
              </Link>
              <Link
                href="/interview"
                className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Interview
              </Link>
              <form action="/auth/signout" method="post" className="ml-1">
                <button
                  type="submit"
                  className="rounded-lg px-3 py-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800 transition hover:bg-emerald-100"
            >
              Recruiter login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
