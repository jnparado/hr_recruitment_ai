import { hasRecruiterSession, RECRUITER_EMAIL } from "@/lib/recruiter-session";

export type RecruiterUser = { email: string };

/** Returns the logged-in recruiter, or null if anonymous. */
export async function getRecruiter(): Promise<RecruiterUser | null> {
  if (await hasRecruiterSession()) {
    return { email: RECRUITER_EMAIL };
  }
  return null;
}

/** For API routes — 401 JSON response when not logged in as recruiter. */
export async function requireRecruiter(): Promise<
  | { user: RecruiterUser; error?: undefined }
  | { user?: undefined; error: Response }
> {
  const user = await getRecruiter();
  if (!user) {
    return {
      error: Response.json(
        { error: "Recruiter login required." },
        { status: 401 }
      ),
    };
  }
  return { user };
}
