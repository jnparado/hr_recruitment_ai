import type { DbJob } from "@/lib/types";
import { getJob, listJobs } from "@/lib/db";

/** Fallback jobs when Supabase tables are not yet created. */
export const SEED_JOBS: DbJob[] = [
  {
    id: "seed-swe",
    title: "Senior Software Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Build and scale our HR automation platform using Next.js, TypeScript, and Supabase. You will own features end-to-end from design through deployment.",
    requirements:
      "5+ years software engineering. Strong TypeScript/React. Experience with PostgreSQL or Supabase. Familiarity with AI APIs a plus.",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-hr",
    title: "HR Operations Specialist",
    department: "People",
    location: "Manila, PH",
    type: "Full-time",
    description:
      "Manage the full recruitment lifecycle — from job posting through onboarding. Partner with hiring managers to define roles and run structured interview processes.",
    requirements:
      "3+ years HR or recruitment experience. Strong communication. Comfortable with ATS tools and data-driven hiring.",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-ai",
    title: "AI/ML Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Design and improve our AI resume parsing, job matching, and interview scoring pipelines powered by Grok and n8n automation.",
    requirements:
      "Experience with LLM APIs, prompt engineering, and workflow automation (n8n/Zapier). Python or TypeScript. ML fundamentals.",
    active: true,
    created_at: new Date().toISOString(),
  },
];

export function getSeedJob(id: string): DbJob | undefined {
  return SEED_JOBS.find((j) => j.id === id);
}

export async function resolveJob(id: string): Promise<DbJob | null> {
  try {
    const job = await getJob(id);
    if (job) return job;
  } catch {
    // fall through to seed
  }
  return getSeedJob(id) ?? null;
}

export async function fetchJobs(): Promise<DbJob[]> {
  try {
    const jobs = await listJobs();
    return jobs.length ? jobs : SEED_JOBS;
  } catch {
    return SEED_JOBS;
  }
}
