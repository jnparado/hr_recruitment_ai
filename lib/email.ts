/**
 * App email delivery: Resend (preferred) → n8n webhook → log-only fallback.
 * Invite links are always created even when email isn't delivered.
 */

export type EmailPayload = {
  to: string;
  subject: string;
  body: string;
  /** Optional HTML; defaults to escaped plain text in <pre>. */
  html?: string;
};

export type SendEmailResult = {
  sent: boolean;
  provider?: "resend" | "n8n";
  error?: string;
};

function plainToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<pre style="font-family:ui-sans-serif,system-ui,sans-serif;white-space:pre-wrap;line-height:1.5;color:#0f172a">${escaped}</pre>`;
}

async function sendViaResend(email: EmailPayload): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { sent: false, error: "RESEND_API_KEY not set" };

  const from =
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "HR Process <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email.to],
      subject: email.subject,
      text: email.body,
      html: email.html || plainToHtml(email.body),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { sent: false, error: `Resend ${res.status}: ${detail || res.statusText}` };
  }

  return { sent: true, provider: "resend" };
}

async function sendViaN8n(
  event: string,
  email: EmailPayload,
  meta?: Record<string, unknown>
): Promise<SendEmailResult> {
  const url = process.env.N8N_WEBHOOK_URL?.trim();
  if (!url) return { sent: false, error: "N8N_WEBHOOK_URL not configured" };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.N8N_WEBHOOK_SECRET
        ? { "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET }
        : {}),
    },
    body: JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      email: {
        to: email.to,
        subject: email.subject,
        body: email.body,
      },
      ...meta,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { sent: false, error: `n8n returned ${res.status}: ${detail}` };
  }

  return { sent: true, provider: "n8n" };
}

/**
 * Send transactional email. Tries Resend first, then n8n.
 */
export async function sendAppEmail(input: {
  event: string;
  email: EmailPayload;
  meta?: Record<string, unknown>;
}): Promise<SendEmailResult> {
  const { event, email, meta } = input;

  if (process.env.RESEND_API_KEY?.trim()) {
    try {
      const viaResend = await sendViaResend(email);
      if (viaResend.sent) return viaResend;
      console.warn("[email] Resend failed, trying n8n:", viaResend.error);
    } catch (err) {
      console.warn(
        "[email] Resend error, trying n8n:",
        err instanceof Error ? err.message : err
      );
    }
  }

  if (process.env.N8N_WEBHOOK_URL?.trim()) {
    try {
      return await sendViaN8n(event, email, meta);
    } catch (err) {
      return {
        sent: false,
        error: err instanceof Error ? err.message : "n8n email trigger failed",
      };
    }
  }

  console.info("[email] queued (no provider)", {
    event,
    to: email.to,
    subject: email.subject,
  });

  return {
    sent: false,
    error:
      "No email provider configured. Add RESEND_API_KEY (recommended) or N8N_WEBHOOK_URL in Vercel env.",
  };
}
