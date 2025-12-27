"use client";

import { useState } from "react";
import Link from "next/link";
// import { Itinerary } from "@/lib/types"; // Adjust if Itinerary type is different for list view
import { Calendar, ChevronRight, Trash2, Map } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { deleteItineraryAction } from "@/lib/db-actions";

// Create a type that matches what getSavedItinerariesAction returns
type SavedTripSummary = {
  id: string;
  cityId: string;
  name: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  city: string | null;
  country: string | null;
};

interface SavedTripListProps {
  initialTrips: SavedTripSummary[];
}

export default function SavedTripList({ initialTrips }: SavedTripListProps) {
  const [trips, setTrips] = useState<SavedTripSummary[]>(initialTrips);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state if props change (optional, but good if server re-renders)
  // useEffect(() => setTrips(initialTrips), [initialTrips]);
  // actually better to just rely on server revalidation and router.refresh if possible,
  // but for immediate feedback local state is good.

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    setTripToDelete(id);
  };

  const confirmDelete = async () => {
    if (!tripToDelete) return;
    setIsDeleting(true);
    try {
      await deleteItineraryAction(tripToDelete);
      // Update local state to remove the deleted trip immediately
      setTrips((prev) => prev.filter((t) => t.id !== tripToDelete));
      setTripToDelete(null);
    } catch (error) {
      console.error("Failed to delete trip:", error);
      alert("Failed to delete trip. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setTripToDelete(null);
  };

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="opacity-70">No saved trips yet.</p>
        <Link href="/" className="btn btn-link">
          Plan a trip now
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="group relative card card-side bg-base-100 shadow-md border border-base-200 hover:scale-[1.01] transition-transform"
          >
            <Link href={`/saved/${trip.id}`} className="flex-1 flex">
              <div className="card-body p-4 sm:p-6 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="card-title text-lg">{trip.name || "Untitled Trip"}</h2>
                    <p className="text-sm text-base-content/70 font-medium">
                      {trip.city}, {trip.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : "No date"}
                    {" - "}
                    {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center pr-12 text-base-content/30">
                {/* Space for delete button and chevron */}
                <ChevronRight />
              </div>
            </Link>

            {/* Delete Button - Positioned absolutely or flex-end */}
            <button
              onClick={(e) => handleDeleteClick(e, trip.id)}
              className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-ghost btn-circle btn-sm text-error opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title="Delete Trip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!tripToDelete}
        title="Delete Trip"
        message="Are you sure you want to delete this trip? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
        confirmText={isDeleting ? "Deleting..." : "Delete"}
      />
    </>
  );
}
