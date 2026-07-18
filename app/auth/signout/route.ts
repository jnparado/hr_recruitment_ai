import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const referer = request.headers.get("referer");
  const url = referer ? new URL(referer) : new URL("/", request.url);
  return NextResponse.redirect(new URL("/login", url.origin), { status: 303 });
}
