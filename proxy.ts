import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/auth-proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and images.
     * Candidate routes (/careers, /call) stay public; recruiter paths are gated in updateSession.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
