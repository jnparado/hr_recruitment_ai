import { createApplication } from "@/lib/db";
import { triggerN8nApplication } from "@/lib/n8n";
import { resolveJob } from "@/lib/jobs";
import { uploadCertificate, uploadResume } from "@/lib/storage";

export const maxDuration = 60;

const CERT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function isCertificateFile(file: File) {
  const lower = file.name.toLowerCase();
  return (
    CERT_TYPES.has(file.type) ||
    lower.endsWith(".pdf") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp")
  );
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
  const certificateEntries = form.getAll("certificates");

  if (!jobId || !applicantName || !applicantEmail) {
    return Response.json({ error: "Name, email, and job are required." }, { status: 400 });
  }
  if (!(resume instanceof File) || resume.size === 0) {
    return Response.json({ error: "A resume PDF is required." }, { status: 400 });
  }
  if (!resume.name.toLowerCase().endsWith(".pdf")) {
    return Response.json({ error: "Resume must be a PDF file." }, { status: 400 });
  }

  const certificates = certificateEntries.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0
  );
  for (const cert of certificates) {
    if (!isCertificateFile(cert)) {
      return Response.json(
        { error: `Unsupported certificate file: ${cert.name}. Use PDF, JPG, or PNG.` },
        { status: 400 }
      );
    }
  }

  const job = await resolveJob(jobId);
  if (!job) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  const folder = `applications/${jobId}`;

  let storedResume;
  try {
    storedResume = await uploadResume(resume, folder);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Resume upload failed." },
      { status: 502 }
    );
  }

  const storedCertificates: { fileName: string; storagePath: string; storageUrl: string }[] = [];
  for (const cert of certificates) {
    try {
      const uploaded = await uploadCertificate(cert, folder);
      storedCertificates.push({
        fileName: uploaded.fileName,
        storagePath: uploaded.storagePath,
        storageUrl: uploaded.storageUrl,
      });
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "Certificate upload failed." },
        { status: 502 }
      );
    }
  }

  let applicationId: string;
  try {
    const app = await createApplication({
      jobId: job.id.startsWith("seed-") ? null : job.id,
      jobTitle: job.title,
      applicantName,
      applicantEmail,
      resumePath: storedResume.storagePath,
      resumeUrl: storedResume.storageUrl,
      certificateFiles: storedCertificates,
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
    resumeUrl: storedResume.storageUrl,
    resumePath: storedResume.storagePath,
    certificateFiles: storedCertificates,
  });

  return Response.json({
    success: true,
    applicationId,
    resumeUrl: storedResume.storageUrl,
    certificateFiles: storedCertificates,
    voiceInterviewUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/call/${applicationId}`,
    n8nTriggered: n8n.triggered,
    n8nError: n8n.error,
    message: "Application received! Start your AI voice screening interview below.",
  });
}
