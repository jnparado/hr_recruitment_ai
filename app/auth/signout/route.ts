import { NextResponse } from "next/server";
import { RECRUITER_COOKIE, recruiterCookieOptions } from "@/lib/recruiter-session";

export async function POST(request: Request) {
  const referer = request.headers.get("referer");
  const url = referer ? new URL(referer) : new URL("/", request.url);
  const res = NextResponse.redirect(new URL("/login", url.origin), {
    status: 303,
  });
  res.cookies.set(RECRUITER_COOKIE, "", {
    ...recruiterCookieOptions(0),
    maxAge: 0,
  });
  return res;
}
