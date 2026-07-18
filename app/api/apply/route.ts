import { RESUME_BUCKET, supabaseAdmin } from "@/lib/supabase";
import { createApplication } from "@/lib/db";
import { triggerN8nApplication } from "@/lib/n8n";
import { resolveJob } from "@/lib/jobs";

export const maxDuration = 60;

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-() ]/g, "_");
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  const jobId = String(form.get("jobId") || "").trim();
  const applicantName = String(form.get("name") || "").trim();
  const applicantEmail = String(form.get("email") || "").trim();
  const resume = form.get("resume");

  if (!jobId || !applicantName || !applicantEmail) {
    return Response.json({ error: "Name, email, and job are required." }, { status: 400 });
  }
  if (!(resume instanceof File) || resume.size === 0) {
    return Response.json({ error: "A resume PDF is required." }, { status: 400 });
  }
  if (!resume.name.toLowerCase().endsWith(".pdf")) {
    return Response.json({ error: "Resume must be a PDF file." }, { status: 400 });
  }

  const job = await resolveJob(jobId);
  if (!job) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  const storagePath = `applications/${jobId}/${Date.now()}-${sanitizeFileName(resume.name)}`;
  const buffer = Buffer.from(await resume.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin()
    .storage.from(RESUME_BUCKET)
    .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    return Response.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 502 });
  }

  const { data: urlData } = supabaseAdmin().storage.from(RESUME_BUCKET).getPublicUrl(storagePath);
  const resumeUrl = urlData.publicUrl;

  let applicationId: string;
  try {
    const app = await createApplication({
      jobId: job.id.startsWith("seed-") ? null : job.id,
      jobTitle: job.title,
      applicantName,
      applicantEmail,
      resumePath: storagePath,
      resumeUrl,
    });
    applicationId = app.id;
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to save application. Run supabase/schema.sql first.",
      },
      { status: 502 }
    );
  }

  const n8n = await triggerN8nApplication({
    applicationId,
    jobId: job.id,
    jobTitle: job.title,
    applicantName,
    applicantEmail,
    resumeUrl,
    resumePath: storagePath,
  });

  return Response.json({
    success: true,
    applicationId,
    resumeUrl,
    voiceInterviewUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/call/${applicationId}`,
    n8nTriggered: n8n.triggered,
    n8nError: n8n.error,
    message: "Application received! Start your AI voice screening interview below.",
  });
}
