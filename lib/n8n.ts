import { appBaseUrl } from "@/lib/app-url";
import { sendAppEmail } from "@/lib/email";

/** Triggers the n8n workflow when a new application is received.
 * Primary payload matches Postman / n8n Webhook contract:
 * { application_id, candidate_id, job_id, resume_url }
 */
export async function triggerN8nApplication(payload: {
  applicationId: string;
  candidateId?: string | null;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  resumeUrl: string;
  resumePath: string;
}): Promise<{ triggered: boolean; error?: string }> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return { triggered: false, error: "N8N_WEBHOOK_URL not configured" };

  const base = appBaseUrl();

  // Contract body (snake_case) — what your n8n Webhook + Postman expect
  const contract = {
    application_id: payload.applicationId,
    candidate_id: payload.candidateId || null,
    job_id: payload.jobId,
    resume_url: payload.resumeUrl,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({
        ...contract,
        // CamelCase aliases + extras for optional richer workflows
        event: "application.received",
        timestamp: new Date().toISOString(),
        applicationId: payload.applicationId,
        candidateId: payload.candidateId || null,
        jobId: payload.jobId,
        jobTitle: payload.jobTitle,
        applicantName: payload.applicantName,
        applicantEmail: payload.applicantEmail,
        resumeUrl: payload.resumeUrl,
        resumePath: payload.resumePath,
        processUrl: `${base}/api/webhooks/n8n/process`,
        rankUrl: `${base}/api/webhooks/n8n/rank`,
        scheduleUrl: `${base}/api/webhooks/n8n/schedule`,
        notifyUrl: `${base}/api/webhooks/n8n/notify`,
        voiceInterviewUrl: `${base}/call/${payload.applicationId}`,
        trackUrl: `${base}/careers/track?id=${encodeURIComponent(payload.applicationId)}`,
        confirmationEmail: {
          to: payload.applicantEmail,
          subject: `We received your application — ${payload.jobTitle}`,
        },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { triggered: false, error: `n8n returned ${res.status}: ${detail}` };
    }
    return { triggered: true };
  } catch (err) {
    return {
      triggered: false,
      error: err instanceof Error ? err.message : "n8n trigger failed",
    };
  }
}

export function recruiterEmailPayload(input: {
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  matchScore: number;
  rank: number;
  fitSummary: string;
  applicationId: string;
}) {
  return {
    to: process.env.RECRUITER_EMAIL || "recruiter@company.com",
    subject: `New candidate: ${input.candidateName} — ${input.jobTitle} (${input.matchScore}/100)`,
    body: [
      `A new candidate applied for ${input.jobTitle}.`,
      ``,
      `Candidate: ${input.candidateName} (${input.candidateEmail})`,
      `Match score: ${input.matchScore}/100`,
      `Rank: #${input.rank}`,
      ``,
      `Summary: ${input.fitSummary}`,
      ``,
      `Application ID: ${input.applicationId}`,
    ].join("\n"),
  };
}

export function googleCalendarPayload(input: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  format: string;
}) {
  return {
    summary: `Interview: ${input.candidateName} — ${input.jobTitle}`,
    description: `${input.format} interview with ${input.candidateName} for ${input.jobTitle}`,
    start: `${input.scheduledDate}T${to24h(input.scheduledTime)}`,
    durationMinutes: input.durationMinutes,
    attendees: [input.candidateEmail],
    reminders: [
      { method: "email", minutes: 24 * 60 },
      { method: "popup", minutes: 30 },
    ],
  };
}

/**
 * Send any email payload (interview invites, reports, etc.).
 * Uses Resend when RESEND_API_KEY is set, otherwise n8n webhook.
 */
export async function triggerN8nEmail(input: {
  event: string;
  email: { to: string; subject: string; body: string };
  meta?: Record<string, unknown>;
}): Promise<{ sent: boolean; error?: string; provider?: string }> {
  return sendAppEmail(input);
}

function to24h(time: string): string {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return "09:00:00";
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}:00`;
}
