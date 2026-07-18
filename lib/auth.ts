import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/** Returns the logged-in recruiter, or null if anonymous. */
export async function getRecruiter(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/** For API routes — 401 JSON response when not logged in as recruiter. */
export async function requireRecruiter(): Promise<
  { user: User; error?: undefined } | { user?: undefined; error: Response }
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
