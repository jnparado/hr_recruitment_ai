"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RecruiterNotifications } from "@/app/_components/RecruiterNotifications";
import { COMPANY } from "@/lib/career-site";

type SiteHeaderProps = {
  isRecruiter: boolean;
};

/** Public Career Website + voice call + AI Interview Room — candidates only. */
function isPublicApplicantPath(pathname: string) {
  return (
    pathname === "/careers" ||
    pathname.startsWith("/careers/") ||
    pathname.startsWith("/call/") ||
    pathname.startsWith("/ai-interview/")
  );
}

const CAREER_NAV = [
  { href: "/careers", label: "Jobs", match: (p: string) => p === "/careers" || p.startsWith("/careers/jobs") },
  { href: "/careers/company", label: "Company", match: (p: string) => p.startsWith("/careers/company") },
  { href: "/careers/track", label: "Track status", match: (p: string) => p.startsWith("/careers/track") },
] as const;

export function SiteHeader({ isRecruiter }: SiteHeaderProps) {
  const pathname = usePathname() || "/";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const publicMode = mounted && isPublicApplicantPath(pathname);

  if (publicMode) {
    return (
      <header className="sticky top-0 z-20 border-b border-indigo-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/careers" className="flex shrink-0 items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              H
            </span>
            <span className="hidden sm:inline">{COMPANY.name}</span>
            <span className="sm:hidden">Careers</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto text-sm font-medium text-slate-600">
            {CAREER_NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 transition sm:px-3 ${
                    active
                      ? "bg-indigo-50 text-indigo-800"
                      : "hover:bg-indigo-50 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
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
          {isRecruiter ? (
            <>
              <span className="hidden px-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 sm:inline">
                Recruiter Admin
              </span>
              <RecruiterNotifications />
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
            <>
              <span className="hidden px-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 sm:inline">
                Public
              </span>
              <Link
                href="/careers"
                className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Career Website
              </Link>
              <Link
                href="/login"
                className="ml-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800 transition hover:bg-emerald-100"
              >
                Recruiter login
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
