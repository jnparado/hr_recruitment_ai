/** Public Career Website copy and helpers (candidates only). */

export const COMPANY = {
  name: "Horizon Talent",
  tagline: "Build products that help people find meaningful work.",
  about: [
    "Horizon Talent builds AI-assisted hiring tools used by growing teams.",
    "We care about clarity, fairness, and giving every candidate a respectful experience — from browsing open roles to hearing back after you apply.",
    "Our offices are remote-first, with collaboration hubs in Manila and Singapore.",
  ],
  values: [
    { title: "Candidate first", body: "Clear job posts, timely updates, and no black-box silence." },
    { title: "Craft", body: "We ship carefully — product quality and hiring quality go together." },
    { title: "Inclusion", body: "We evaluate skills and potential, not pedigree theater." },
  ],
  locations: ["Remote", "Manila, PH", "Singapore"],
  contactEmail: "careers@horizontalent.example",
} as const;

/** Candidate-facing status labels (never expose recruiter-only jargon). */
export const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  received: "Application received",
  extracting: "Resume under review",
  scored: "Under review",
  shortlisted: "Shortlisted",
  rejected: "Not moving forward",
  interview_scheduled: "Interview scheduled",
  interview_transcribed: "Interview completed",
  interview_completed: "Interview completed",
};

export function candidateStatusLabel(status: string): string {
  return CANDIDATE_STATUS_LABELS[status] ?? "In progress";
}

export function candidateConfirmationEmail(input: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  applicationId: string;
  trackUrl: string;
}) {
  return {
    to: input.candidateEmail,
    subject: `We received your application — ${input.jobTitle}`,
    body: [
      `Hi ${input.candidateName},`,
      ``,
      `Thank you for applying to ${input.jobTitle} at ${COMPANY.name}.`,
      ``,
      `Your application has been received. Our team (and automation) will review your resume shortly.`,
      ``,
      `Application ID: ${input.applicationId}`,
      `Track your status anytime: ${input.trackUrl}`,
      ``,
      `If you have questions, reply to this email or write ${COMPANY.contactEmail}.`,
      ``,
      `— ${COMPANY.name} Careers`,
    ].join("\n"),
  };
}
