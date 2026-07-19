"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const RECRUITER_MODULES = [
  { href: "/dashboard", label: "Dashboard", match: (p: string) => p === "/dashboard" },
  { href: "/dashboard/jobs", label: "Job Management" },
  { href: "/dashboard/applicants", label: "Candidates" },
  { href: "/dashboard/ranking", label: "Candidate Ranking" },
  { href: "/dashboard/ai-interview", label: "AI Interview Room" },
  { href: "/dashboard/ai", label: "AI Features" },
  { href: "/dashboard/email", label: "Email Center" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

export function RecruiterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/dashboard";

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8 sm:px-6">
      <aside className="hidden w-52 shrink-0 md:block">
        <div className="sticky top-20 rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white p-3 shadow-sm">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Recruiter Admin
          </p>
          <nav className="mt-2 space-y-0.5">
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
                      ? "bg-emerald-600 text-white"
                      : "text-slate-700 hover:bg-emerald-50"
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
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
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
