"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const RECRUITER_MODULES = [
  { href: "/dashboard", label: "Dashboard", match: (p: string) => p === "/dashboard" },
  { href: "/dashboard/jobs", label: "Job Management" },
  { href: "/dashboard/applicants", label: "Candidates" },
  { href: "/dashboard/ranking", label: "Candidate Ranking" },
  { href: "/dashboard/schedule", label: "Interview Calendar" },
  { href: "/dashboard/ai-interview", label: "AI Interview Room" },
  { href: "/dashboard/ai", label: "AI Features" },
  { href: "/dashboard/email", label: "Email Center" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

export function RecruiterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/dashboard";

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:gap-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-20 overflow-hidden rounded-2xl border border-emerald-200/90 bg-white shadow-sm">
          <div className="border-b border-emerald-100 bg-gradient-to-br from-emerald-600 to-teal-700 px-3 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/90">
              Workspace
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">Recruiter Admin</p>
          </div>
          <nav className="space-y-0.5 p-2.5">
            {RECRUITER_MODULES.map((mod) => {
              const active =
                "match" in mod && mod.match
                  ? mod.match(pathname)
                  : pathname === mod.href || pathname.startsWith(`${mod.href}/`);
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className={`block rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                  }`}
                >
                  {mod.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {RECRUITER_MODULES.map((mod) => {
            const active =
              "match" in mod && mod.match
                ? mod.match(pathname)
                : pathname === mod.href || pathname.startsWith(`${mod.href}/`);
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
              >
                {mod.label}
              </Link>
            );
          })}
        </div>
        {children}
      </div>
    </div>
  );
}
