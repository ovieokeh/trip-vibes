import { createClient } from "@/lib/supabase/server";
import { syncUserToDatabase } from "@/lib/auth-actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Sync the newly verified user to our database
      await syncUserToDatabase();
    }
  }

  // Redirect to home page after verification
  return NextResponse.redirect(`${origin}/`);
}
