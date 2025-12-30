import { NextRequest, NextResponse } from "next/server";
import { getItineraryByIdAction, getCityById } from "@/lib/db-actions";
import { generateICSContent } from "@/lib/export/calendar";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const itinerary = await getItineraryByIdAction(id);

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    const city = await getCityById(itinerary.cityId);
    const cityName = city ? city.name : "Unknown City";

    const { content, filename } = generateICSContent(itinerary, cityName);

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Calendar export error:", error);
    return NextResponse.json({ error: "Failed to generate calendar" }, { status: 500 });
  }
}
