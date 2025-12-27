import { getSavedItinerariesAction } from "@/lib/db-actions";
import SavedTripList from "@/components/SavedTripList";

export default async function SavedTripsPage() {
  const savedTrips = await getSavedItinerariesAction();

  return (
    <div className="max-w-xl mx-auto px-4">
      <h1 className="text-3xl  mb-8 px-2">Saved Trips</h1>

      <SavedTripList
        initialTrips={savedTrips.map((trip) => ({
          ...trip,
          createdAt: trip.createdAt ? new Date(trip.createdAt).toISOString() : new Date().toISOString(),
          // Ensure other dates are strings and handle nulls
          startDate: trip.startDate ? new Date(trip.startDate).toISOString() : null,
          endDate: trip.endDate ? new Date(trip.endDate).toISOString() : null,
        }))}
      />
    </div>
  );
}
