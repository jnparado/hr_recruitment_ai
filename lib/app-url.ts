/** Base URL for links in emails/webhooks (server-side). */
export function appBaseUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
}

/** Prefer the incoming request origin so links work on Vercel without env config. */
export function appOriginFromRequest(request: Request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return appBaseUrl();
  }
}
