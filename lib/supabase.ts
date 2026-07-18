import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const RESUME_BUCKET =
  process.env.SUPABASE_RESUME_BUCKET || "upload_resume";

/** Server-side Supabase client using the service role key (for storage uploads). */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
  }
  return createClient(url, key);
}
