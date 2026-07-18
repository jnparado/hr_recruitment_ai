import { NextResponse } from "next/server";
import {
  recruiterCookieOptions,
  recruiterSessionValue,
  RECRUITER_COOKIE,
  verifyRecruiterCredentials,
} from "@/lib/recruiter-session";

export async function POST(request: Request) {
  let body: { email?: string; password?: string; next?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email || "");
  const password = String(body.password || "");

  if (!verifyRecruiterCredentials(email, password)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const next =
    typeof body.next === "string" && body.next.startsWith("/")
      ? body.next
      : "/dashboard";

  const res = NextResponse.json({ ok: true, next });
  res.cookies.set(
    RECRUITER_COOKIE,
    recruiterSessionValue(),
    recruiterCookieOptions()
  );
  return res;
}
