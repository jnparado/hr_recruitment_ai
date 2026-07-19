"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type SiteHeaderProps = {
  isRecruiter: boolean;
};

/** Public routes: Career Website + voice call — no recruiter chrome. */
function isPublicApplicantPath(pathname: string) {
  return pathname === "/careers" || pathname.startsWith("/call/");
}

export function SiteHeader({ isRecruiter }: SiteHeaderProps) {
  const pathname = usePathname() || "/";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const publicMode = mounted && isPublicApplicantPath(pathname);

  if (publicMode) {
    return (
      <header className="sticky top-0 z-20 border-b border-indigo-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/careers" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              H
            </span>
            Career Website
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
              Public
            </span>
            <Link
              href="/careers"
              className="rounded-lg px-3 py-1.5 font-medium text-slate-700 transition hover:bg-indigo-50"
            >
              Open roles
            </Link>
          </div>
        </div>
      </header>
    );
  }

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
            Public
          </span>
          <Link
            href="/careers"
            className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Career Website
          </Link>

          {isRecruiter ? (
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
