import Link from "next/link";
import { getItineraryByIdAction, getCityById } from "@/lib/db-actions";
import { ChevronLeft } from "lucide-react";
import TripControls from "./TripControls";
import ItineraryEditor from "@/components/ItineraryEditor";
import { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const itinerary = await getItineraryByIdAction(id);

  if (!itinerary) {
    return {
      title: "Trip Not Found",
    };
  }

  const city = await getCityById(itinerary.cityId);
  const cityName = city?.name || "Unknown City";
  const title = itinerary.name || `Trip to ${cityName}`;
  const description = `Check out this trip to ${cityName} on TripVibes!`;
  const firstImage = itinerary.days.find((day) => day.activities.length > 0)?.activities[0].vibe.imageUrl;

  // Get the base URL for absolute paths
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // Convert image URL to absolute if it's a relative API route
  // Social platforms like WhatsApp can't access relative URLs
  let absoluteImageUrl = `${baseUrl}/og-image.jpg`; // fallback
  if (firstImage) {
    // If it starts with /api/, make it absolute
    if (firstImage.startsWith("/")) {
      absoluteImageUrl = `${baseUrl}${firstImage}`;
    } else if (firstImage.startsWith("http")) {
      // Already absolute (e.g., Unsplash URLs from seed data)
      absoluteImageUrl = firstImage;
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${baseUrl}/saved/${id}`,
      siteName: "TripVibes",
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteImageUrl],
    },
  };
}

export default async function SavedTripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const itinerary = await getItineraryByIdAction(id);
  const city = await getCityById(itinerary?.cityId || "");
  const cityName = city?.name || itinerary?.cityId || "Unknown City";

  // Format dates
  const startDate = itinerary?.startDate
    ? new Date(itinerary.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";
  const endDate = itinerary?.endDate
    ? new Date(itinerary.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";
  const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : "";

  if (!itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <h2 className="text-2xl font-bold">Trip Not Found</h2>
        <Link href="/saved" className="btn btn-primary">
          Back to Saved Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-12 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/saved" className="btn btn-ghost btn-circle btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-sm font-bold opacity-60 uppercase tracking-widest">SAVED TRIP</h1>
        </div>
        <TripControls id={id} initialName={itinerary.name || `${cityName} Trip`} />
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-black mb-1">{itinerary.name || `Trip to ${cityName}`}</h2>
        <p className="opacity-60 font-medium">
          {cityName}
          {dateRange ? ` • ${dateRange}` : ""}
        </p>
      </div>

      <ItineraryEditor initialItinerary={itinerary} cityId={itinerary.cityId} isSavedMode={true} />
    </div>
  );
}
