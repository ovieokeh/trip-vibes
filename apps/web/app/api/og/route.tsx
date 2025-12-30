import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get("title")?.slice(0, 100) || "My Trip";
    const city = searchParams.get("city")?.slice(0, 50) || "TripVibes";
    const date = searchParams.get("date")?.slice(0, 50) || "";
    const ref = searchParams.get("ref");

    let imageData: string | null = null;

    // 1. Fetch the image server-side to ensure it's available to Satori
    if (ref && process.env.GOOGLE_PLACES_API_KEY) {
      const bgUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${ref}&key=${process.env.GOOGLE_PLACES_API_KEY}`;

      const res = await fetch(bgUrl);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        // Convert to base64 to embed directly
        const base64Image = Buffer.from(buffer).toString("base64");
        imageData = `data:image/jpeg;base64,${base64Image}`;
      }
    }

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          color: "white",
          position: "relative",
        }}
      >
        {imageData && (
          <img
            src={imageData}
            alt="Background"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.5,
            }}
          />
        )}

        {/* Gradient Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(to bottom, rgba(15,23,42,0.2), rgba(15,23,42,0.8))",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            zIndex: 10,
          }}
        >
          <div
            style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: "#e2e8f0", textTransform: "uppercase" }}
          >
            TripVibes
          </div>
          <div
            style={{
              fontSize: 80, // Increased for 630px height
              fontWeight: 900,
              marginBottom: 30,
              color: "white",
              padding: "0 60px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              background: "rgba(15, 23, 42, 0.8)",
              padding: "12px 32px",
              borderRadius: "100px",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <span style={{ color: "#fff" }}>{city}</span>
            {date && <span style={{ margin: "0 10px" }}>•</span>}
            {date && <span>{date}</span>}
          </div>
        </div>
      </div>,
      {
        width: 600,
        height: 315, // Matches standard OG specs
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image`, { status: 500 });
  }
}
