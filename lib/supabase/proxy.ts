import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase config, skip session refresh but still block recruiter routes.
  if (!url || !key) {
    if (isRecruiterPath(request.nextUrl.pathname)) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(login);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (isRecruiterPath(pathname) && !user) {
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

  // Logged-in recruiters don't need the login page
  if (user && pathname === "/login") {
    const next = request.nextUrl.searchParams.get("next") || "/dashboard";
    return NextResponse.redirect(new URL(next, request.url));
  }

  return supabaseResponse;
}
