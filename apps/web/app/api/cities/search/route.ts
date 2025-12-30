import { NextRequest, NextResponse } from "next/server";
import { searchCitiesAction } from "@/lib/db-actions";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    if (!query || query.length < 2) {
      return NextResponse.json([], {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const cities = await searchCitiesAction(query);
    return NextResponse.json(cities, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("Search cities error:", error);
    return NextResponse.json(
      { error: "Failed to search cities" },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}
