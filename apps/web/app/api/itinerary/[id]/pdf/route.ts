import { NextRequest, NextResponse } from "next/server";
import { getItineraryByIdAction, getCityById } from "@/lib/db-actions";
import { generateItineraryPDFDoc } from "@/lib/export/pdf";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const itinerary = await getItineraryByIdAction(id);

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    const city = await getCityById(itinerary.cityId);
    const cityName = city ? city.name : "Unknown City";

    // Generate PDF doc
    const doc = await generateItineraryPDFDoc(itinerary, cityName);

    // Get ArrayBuffer - safe for server side (Node.js)
    const pdfArrayBuffer = doc.output("arraybuffer");

    // Convert to Buffer for NextResponse
    const buffer = Buffer.from(pdfArrayBuffer);

    const filename = `${(itinerary.name || cityName).replace(/[^a-zA-Z0-9]/g, "_")}_itinerary.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
