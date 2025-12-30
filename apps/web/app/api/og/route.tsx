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

    let bgUrl = null;
    if (ref && process.env.GOOGLE_PLACES_API_KEY) {
      bgUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${ref}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
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
          backgroundColor: "#0f172a", // Fallback color
          color: "white",
          position: "relative",
        }}
      >
        {/* Background Image with Overlay */}
        {bgUrl && (
          <img
            src={bgUrl}
            alt="Background"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.6,
              filter: "blur(10px) brightness(0.5)",
            }}
          />
        )}

        {/* Dark Gradient Overlay for readability */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(to bottom, rgba(15,23,42,0.3), rgba(15,23,42,0.8))",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            textAlign: "center",
            padding: "40px",
          }}
        >
          {/* Logo / Brand */}
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 20,
              color: "#e2e8f0",
              letterSpacing: "-0.05em",
              textTransform: "uppercase",
            }}
          >
            TripVibes
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 20,
              backgroundImage: "linear-gradient(90deg, #fff, #cbd5e1)",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "0 4px 8px rgba(0,0,0,0.3)",
              letterSpacing: "-0.03em",
              maxWidth: "900px",
            }}
          >
            {title}
          </div>

          {/* City & Date Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: 28,
              color: "#94a3b8",
              fontWeight: 500,
              background: "rgba(15, 23, 42, 0.6)",
              padding: "10px 24px",
              borderRadius: "100px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span style={{ color: "#fff" }}>{city}</span>
            {date && <span>•</span>}
            {date && <span>{date}</span>}
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 400,
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      }
    );
  } catch (e: any) {
    console.error(e.message);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
