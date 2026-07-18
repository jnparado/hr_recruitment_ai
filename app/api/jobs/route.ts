import { fetchJobs } from "@/lib/jobs";

export async function GET() {
  const jobs = await fetchJobs();
  return Response.json({ jobs });
}
