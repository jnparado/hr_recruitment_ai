import { requireRecruiter } from "@/lib/auth";
import { createJob, listAllJobs, updateJob } from "@/lib/db";

export async function GET() {
  const auth = await requireRecruiter();
  if (auth.error) return auth.error;

  try {
    const jobs = await listAllJobs();
    return Response.json({ jobs });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to load jobs." },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRecruiter();
  if (auth.error) return auth.error;

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    department?: string;
    location?: string;
    type?: string;
    description?: string;
    requirements?: string;
  } | null;

  if (!body?.title?.trim() || !body?.description?.trim()) {
    return Response.json({ error: "Title and description are required." }, { status: 400 });
  }

  try {
    const job = await createJob({
      title: body.title.trim(),
      department: body.department?.trim() || "General",
      location: body.location?.trim() || "Remote",
      type: body.type?.trim() || "Full-time",
      description: body.description.trim(),
      requirements: body.requirements?.trim() || "",
    });
    return Response.json({ job });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create job." },
      { status: 502 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireRecruiter();
  if (auth.error) return auth.error;

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    title?: string;
    department?: string;
    location?: string;
    type?: string;
    description?: string;
    requirements?: string;
    status?: "open" | "closed" | "archived";
  } | null;

  if (!body?.id) {
    return Response.json({ error: "Job id is required." }, { status: 400 });
  }

  try {
    const job = await updateJob(body.id, {
      title: body.title,
      department: body.department,
      location: body.location,
      type: body.type,
      description: body.description,
      requirements: body.requirements,
      status: body.status,
    });
    return Response.json({ job });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to update job." },
      { status: 502 }
    );
  }
}
