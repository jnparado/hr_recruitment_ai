import { cookies } from "next/headers";

export const RECRUITER_COOKIE = "recruiter_session";

/** Defaults so login works on Vercel even if env vars are missing */
const DEFAULT_EMAIL = "recruiter@gmail.com";
const DEFAULT_PASSWORD = "12345";

const SESSION_VALUE = "recruiter-ok";

/**
 * Login email/password. Uses RECRUITER_LOGIN_* only (not RECRUITER_EMAIL),
 * so n8n notify settings on Vercel cannot break login.
 * Defaults: recruiter@gmail.com / 12345
 */
export function getRecruiterEmail() {
  return (process.env.RECRUITER_LOGIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
}

export function getRecruiterPassword() {
  return process.env.RECRUITER_LOGIN_PASSWORD || DEFAULT_PASSWORD;
}

export function verifyRecruiterCredentials(email: string, password: string) {
  return (
    email.trim().toLowerCase() === getRecruiterEmail() &&
    password === getRecruiterPassword()
  );
}

export function isRecruiterSessionToken(value: string | undefined | null) {
  return value === SESSION_VALUE;
}

export function recruiterCookieOptions(maxAge = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function recruiterSessionValue() {
  return SESSION_VALUE;
}

/** Server-side: is the current request logged in as recruiter? */
export async function hasRecruiterSession() {
  const jar = await cookies();
  return isRecruiterSessionToken(jar.get(RECRUITER_COOKIE)?.value);
}
