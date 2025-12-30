import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Allow CORS for mobile app
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ credits: 0 }, { headers: corsHeaders });
    }

    const result = await db.select({ credits: users.credits }).from(users).where(eq(users.id, user.id)).limit(1);

    const credits = result[0]?.credits ?? 0;

    return NextResponse.json({ credits }, { headers: corsHeaders });
  } catch (error) {
    console.error("[GET /api/user/credits] Error:", error);
    return NextResponse.json({ credits: 0 }, { headers: corsHeaders });
  }
}
