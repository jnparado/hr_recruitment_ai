import { cookies } from "next/headers";

export const RECRUITER_COOKIE = "recruiter_session";

/** Static demo credentials — recruiter only */
export const RECRUITER_EMAIL = "recruiter@gmail.com";
export const RECRUITER_PASSWORD = "12345";

const SESSION_VALUE = "recruiter-ok";

export function verifyRecruiterCredentials(email: string, password: string) {
  return (
    email.trim().toLowerCase() === RECRUITER_EMAIL &&
    password === RECRUITER_PASSWORD
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
