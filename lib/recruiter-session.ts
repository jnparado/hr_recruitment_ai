import { cookies } from "next/headers";

export const RECRUITER_COOKIE = "recruiter_session";

const SESSION_VALUE = "recruiter-ok";

export function getRecruiterEmail() {
  return (process.env.RECRUITER_EMAIL || "").trim().toLowerCase();
}

export function getRecruiterPassword() {
  return process.env.RECRUITER_PASSWORD || "";
}

export function verifyRecruiterCredentials(email: string, password: string) {
  const expectedEmail = getRecruiterEmail();
  const expectedPassword = getRecruiterPassword();
  if (!expectedEmail || !expectedPassword) return false;
  return (
    email.trim().toLowerCase() === expectedEmail && password === expectedPassword
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
