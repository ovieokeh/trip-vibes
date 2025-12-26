import Link from "next/link";
import { getItineraryByIdAction, getCityById } from "@/lib/db-actions";
import ItineraryDay from "@/components/ItineraryDay";
import { ChevronLeft } from "lucide-react";
import TripControls from "./TripControls";

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

      <div>
        {itinerary.days.map((day) => (
          <ItineraryDay key={day.id} day={day} />
        ))}
      </div>
    </div>
  );
}
