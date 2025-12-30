import { NextRequest, NextResponse } from "next/server";
import { getSavedItinerariesAction } from "@/lib/db-actions";

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
    const itineraries = await getSavedItinerariesAction();
    return NextResponse.json(itineraries, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("List itineraries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch itineraries" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
