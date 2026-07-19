import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { COMPANY } from "@/lib/career-site";
import type { DbAiInterviewInvite, DbApplication } from "@/lib/types";
import { updateApplicationStatus } from "@/lib/db";

export function generateInterviewToken(): string {
  return randomBytes(24).toString("hex");
}

export async function createAiInterviewInvite(input: {
  application: DbApplication;
  durationMinutes?: number;
  deadlineDays?: number;
}): Promise<DbAiInterviewInvite> {
  const token = generateInterviewToken();
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + (input.deadlineDays ?? 7));

  const { data, error } = await supabaseAdmin()
    .from("ai_interview_invites")
    .insert({
      token,
      application_id: input.application.id,
      job_title: input.application.job_title || "Open Role",
      candidate_name: input.application.applicant_name,
      candidate_email: input.application.applicant_email,
      duration_minutes: input.durationMinutes ?? 30,
      deadline: deadline.toISOString(),
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await updateApplicationStatus(
    input.application.id,
    "ai_interview_invited",
    input.application.match_score ?? undefined,
    input.application.rank ?? undefined
  );

  return data as DbAiInterviewInvite;
}

export async function getAiInterviewInviteByToken(
  token: string
): Promise<DbAiInterviewInvite | null> {
  const { data, error } = await supabaseAdmin()
    .from("ai_interview_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as DbAiInterviewInvite | null;
}

export async function updateAiInterviewInvite(
  token: string,
  patch: Partial<{
    status: string;
    consent_at: string;
    devices_ok_at: string;
    identity_ok_at: string;
    verified_at: string;
    started_at: string;
    completed_at: string;
  }>
): Promise<DbAiInterviewInvite> {
  const { data, error } = await supabaseAdmin()
    .from("ai_interview_invites")
    .update(patch)
    .eq("token", token)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DbAiInterviewInvite;
}

export function isInviteExpired(invite: DbAiInterviewInvite): boolean {
  return new Date(invite.deadline).getTime() < Date.now();
}

export function isInviteUsable(invite: DbAiInterviewInvite): boolean {
  if (isInviteExpired(invite)) return false;
  if (invite.status === "completed" || invite.status === "revoked") return false;
  return true;
}

export function aiInterviewInviteEmail(input: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  interviewUrl: string;
  durationMinutes: number;
  deadline: string;
}) {
  const deadlineLabel = new Date(input.deadline).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return {
    to: input.candidateEmail,
    subject: `AI Interview invitation — ${input.jobTitle}`,
    body: [
      `Hi ${input.candidateName},`,
      ``,
      `You've been invited to complete a first-stage AI interview for ${input.jobTitle} at ${COMPANY.name}.`,
      ``,
      `Duration: about ${input.durationMinutes} minutes`,
      `Complete by: ${deadlineLabel}`,
      `You'll need a working camera and microphone.`,
      ``,
      `Start here (secure link — do not share):`,
      input.interviewUrl,
      ``,
      `This link is only for you and expires after the deadline.`,
      ``,
      `— ${COMPANY.name} Recruiting`,
    ].join("\n"),
  };
}

export function publicInvitePayload(invite: DbAiInterviewInvite) {
  return {
    token: invite.token,
    jobTitle: invite.job_title,
    companyName: COMPANY.name,
    durationMinutes: invite.duration_minutes,
    deadline: invite.deadline,
    expired: isInviteExpired(invite),
    usable: isInviteUsable(invite),
    status: invite.status,
    consentAt: invite.consent_at,
    devicesOkAt: invite.devices_ok_at,
    identityOkAt: invite.identity_ok_at,
    verifiedAt: invite.verified_at,
    // Masked for display only — full match checked server-side on verify
    candidateEmailHint: maskEmail(invite.candidate_email),
    candidateNameHint: invite.candidate_name.split(" ")[0] || "Candidate",
  };
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  const visible = user.slice(0, 2);
  return `${visible}***@${domain}`;
}
