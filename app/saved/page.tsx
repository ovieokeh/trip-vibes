import Link from "next/link";
import { getSavedItinerariesAction } from "@/lib/db-actions";
import { Map, Calendar, ChevronRight } from "lucide-react";

export default async function SavedTripsPage() {
  const savedTrips = await getSavedItinerariesAction();

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-black mb-8 px-2">Saved Trips</h1>

      {savedTrips.length === 0 ? (
        <div className="text-center py-12 opacity-60">
          <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No saved trips yet.</p>
          <Link href="/" className="btn btn-link">
            Plan a trip now
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {savedTrips.map((trip) => (
            <Link
              key={trip.id}
              href={`/saved/${trip.id}`}
              className="card card-side bg-base-100 shadow-md border border-base-200 hover:scale-[1.01] transition-transform"
            >
              <div className="card-body p-4 sm:p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="card-title text-lg">{trip.name}</h2>
                    <p className="text-sm text-base-content/70 font-medium">
                      {trip.city}, {trip.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 text-xs opacity-60">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : "No date"}
                    {" - "}
                    {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center pr-4 text-base-content/30">
                <ChevronRight />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
