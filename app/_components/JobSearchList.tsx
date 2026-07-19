"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DbJob } from "@/lib/types";

type JobSearchListProps = {
  jobs: DbJob[];
};

export function JobSearchList({ jobs }: JobSearchListProps) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [location, setLocation] = useState("all");

  const departments = useMemo(
    () => [...new Set(jobs.map((j) => j.department))].sort(),
    [jobs]
  );
  const locations = useMemo(
    () => [...new Set(jobs.map((j) => j.location))].sort(),
    [jobs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (department !== "all" && job.department !== department) return false;
      if (location !== "all" && job.location !== location) return false;
      if (!q) return true;
      const hay = [
        job.title,
        job.department,
        job.location,
        job.type,
        job.description,
        job.requirements,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [jobs, query, department, location]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="job-search" className="block text-sm font-medium text-slate-900">
            Search jobs
          </label>
          <input
            id="job-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title, skill, location…"
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="sm:w-40">
          <label htmlFor="dept" className="block text-sm font-medium text-slate-900">
            Department
          </label>
          <select
            id="dept"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="all">All</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-40">
          <label htmlFor="loc" className="block text-sm font-medium text-slate-900">
            Location
          </label>
          <select
            id="loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="all">All</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {filtered.length} open {filtered.length === 1 ? "role" : "roles"}
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {filtered.map((job) => (
          <article
            key={job.id}
            className="flex flex-col border-b border-slate-200 pb-5 last:border-0 md:border md:border-slate-200 md:rounded-2xl md:bg-white md:p-5 md:shadow-sm"
          >
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded bg-slate-100 px-2 py-0.5">{job.department}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5">{job.location}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5">{job.type}</span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">{job.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600 line-clamp-3">
              {job.description}
            </p>
            <Link
              href={`/careers/jobs/${job.id}`}
              className="mt-4 inline-flex text-sm font-semibold text-indigo-700 hover:underline"
            >
              View role & apply →
            </Link>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-500">
          No roles match your search. Try different keywords or{" "}
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setDepartment("all");
              setLocation("all");
            }}
            className="font-medium text-indigo-700 hover:underline"
          >
            clear filters
          </button>
          .
        </p>
      )}
    </div>
  );
}
