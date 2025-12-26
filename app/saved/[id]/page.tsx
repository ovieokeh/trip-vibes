import Link from "next/link";
import { getItineraryByIdAction } from "@/lib/db-actions";
import ItineraryDay from "@/components/ItineraryDay";
import { ChevronLeft } from "lucide-react";

export default async function SavedTripDetailsPage({ params }: { params: { id: string } }) {
  const itinerary = await getItineraryByIdAction(params.id);

  if (!itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Trip Not Found</h2>
        <Link href="/saved" className="btn btn-primary">
          Back to Saved Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-12">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/saved" className="btn btn-ghost btn-circle btn-sm">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Saved Trip</h1>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-black mb-2 opacity-90">Trip to {itinerary.cityId}</h2>{" "}
        {/* cityId is often just the ID, ideally we'd join city name but schema is localized. Itinerary object doesn't have city name directly usually, checking type... Itinerary has cityId. We will stick with this or enrich later if needed. */}
      </div>

      <div>
        {itinerary.days.map((day) => (
          <ItineraryDay key={day.id} day={day} />
        ))}
      </div>
    </div>
  );
}
