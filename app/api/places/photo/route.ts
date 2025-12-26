import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const photoReference = searchParams.get("ref");
  const maxWidth = searchParams.get("maxwidth") || "400";

  if (!photoReference) {
    return new NextResponse("Missing photo reference", { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return new NextResponse("Server configuration error", { status: 500 });
  }

  try {
    const googleUrl = `https://maps.googleapis.com/maps/api/place/photo`;

    // Fetch the image from Google as a stream
    const response = await axios.get(googleUrl, {
      params: {
        maxwidth: maxWidth,
        photo_reference: photoReference,
        key: apiKey,
      },
      responseType: "arraybuffer", // Important for binary data
    });

    // Forward the content type and caching headers
    const contentType = response.headers["content-type"] || "image/jpeg";
    const cacheControl = response.headers["cache-control"] || "public, max-age=86400"; // Default 1 day if missing

    return new NextResponse(response.data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    console.error("Error proxying photo:", error);
    return new NextResponse("Failed to fetch photo", { status: 500 });
  }
}
