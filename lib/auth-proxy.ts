import { NextResponse, type NextRequest } from "next/server";
import {
  isRecruiterSessionToken,
  RECRUITER_COOKIE,
} from "@/lib/recruiter-session";

const RECRUITER_PAGE_PREFIXES = [
  "/dashboard",
  "/pipeline",
  "/screening",
  "/interview",
];

const RECRUITER_API_PREFIXES = [
  "/api/dashboard",
  "/api/pipeline",
  "/api/screen",
];

/** Candidate Career Website — recruiters are redirected to the dashboard. */
function isCareerWebsitePath(pathname: string) {
  return pathname === "/careers" || pathname.startsWith("/careers/");
}

function isRecruiterPath(pathname: string) {
  return (
    RECRUITER_PAGE_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    ) ||
    RECRUITER_API_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    )
  );
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const loggedIn = isRecruiterSessionToken(
    request.cookies.get(RECRUITER_COOKIE)?.value
  );

  // Career Website is for candidates only — keep recruiters in their tools.
  if (loggedIn && isCareerWebsitePath(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isRecruiterPath(pathname) && !loggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Recruiter login required." },
        { status: 401 }
      );
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (loggedIn && pathname === "/login") {
    const next = request.nextUrl.searchParams.get("next") || "/dashboard";
    return NextResponse.redirect(new URL(next, request.url));
  }

  return response;
}
