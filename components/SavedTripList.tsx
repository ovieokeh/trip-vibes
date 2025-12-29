"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
// import { Itinerary } from "@/lib/types"; // Adjust if Itinerary type is different for list view
import { Calendar, ChevronRight, Trash2, Map } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { deleteItineraryAction } from "@/lib/db-actions";
import { useTranslations, useFormatter } from "next-intl";

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
  const t = useTranslations("SavedTrips");
  const tc = useTranslations("Confirmation.deleteTrip");
  const formatIntl = useFormatter();
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
      <div className="text-center py-16 px-4">
        {/* Custom Illustrated Empty State */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          {/* Background decorative circle */}
          <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse"></div>

          {/* Main illustration container */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Luggage illustration */}
            <svg viewBox="0 0 120 120" className="w-32 h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Suitcase body */}
              <rect
                x="25"
                y="40"
                width="70"
                height="55"
                rx="8"
                className="fill-base-200 stroke-base-300"
                strokeWidth="2"
              />
              {/* Suitcase handle */}
              <path
                d="M45 40 V30 A10 10 0 0 1 55 20 H65 A10 10 0 0 1 75 30 V40"
                className="stroke-base-300"
                strokeWidth="3"
                fill="none"
              />
              {/* Stripes */}
              <rect x="25" y="55" width="70" height="6" className="fill-primary/20" />
              <rect x="25" y="75" width="70" height="6" className="fill-primary/20" />
              {/* Wheels */}
              <circle cx="40" cy="98" r="5" className="fill-base-300" />
              <circle cx="80" cy="98" r="5" className="fill-base-300" />
              {/* Lock */}
              <rect x="55" y="45" width="10" height="6" rx="1" className="fill-primary" />
            </svg>

            {/* Floating elements */}
            <div className="absolute top-2 right-4 animate-float stagger-1">
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                <span className="text-lg">✈️</span>
              </div>
            </div>
            <div className="absolute bottom-8 left-2 animate-float stagger-2">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                <span className="text-sm">🗺️</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-base-content mb-2">{t("empty")}</h3>
        <p className="text-base-content/50 mb-6 max-w-xs mx-auto">
          {t("emptyDescription") || "Start planning your next adventure and save it here."}
        </p>

        <Link
          href="/"
          className="btn btn-primary btn-lg gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
        >
          <Map className="w-5 h-5" />
          {t("planNow")}
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
                    <h2 className="card-title text-lg">{trip.name || t("untitledTrip")}</h2>
                    <p className="text-sm text-base-content/70 font-medium">
                      {trip.city}, {trip.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 text-xs opacity-80">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {trip.startDate ? formatIntl.dateTime(new Date(trip.startDate)) : t("noDate")}
                    {trip.endDate && (
                      <>
                        {" - "}
                        {formatIntl.dateTime(new Date(trip.endDate))}
                      </>
                    )}
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
              title={tc("title")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!tripToDelete}
        title={tc("title")}
        message={tc("message")}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
        confirmText={isDeleting ? tc("deleting") : tc("confirm")}
      />
    </>
  );
}
