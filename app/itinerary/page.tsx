"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import {
  generateItineraryAction,
  saveItineraryAction,
  getFallbackImageAction,
  getActivitySuggestionsAction,
} from "@/lib/db-actions";
import { Itinerary, TripActivity, Vibe } from "@/lib/types";
import ItineraryDay from "@/components/ItineraryDay";
import AlertModal from "@/components/AlertModal";
import AddActivityModal from "@/components/AddActivityModal";
import { getTransitNote } from "@/lib/geo";

// Note: Metadata cannot be exported from a "use client" component.
// Since this page relies on client-side state (Zustand) for the unsaved itinerary,
// we cannot generate server-side metadata for the specific city here.
// The saved page (app/saved/[id]) handles the shareable metadata.

export default function ItineraryPage() {
  const router = useRouter();
  const prefs = useStore();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Add Activity Modal State
  const [addModal, setAddModal] = useState<{
    isOpen: boolean;
    dayId: string | null;
    suggestions: Vibe[];
    isLoading: boolean;
  }>({
    isOpen: false,
    dayId: null,
    suggestions: [],
    isLoading: false,
  });

  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "error" | "warning" | "success" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    // Basic protection to ensure we have a city selected
    if (!prefs.cityId) {
      router.push("/");
      return;
    }

    // Generate Itinerary using DB-backed Architect
    async function generate() {
      try {
        const result = await generateItineraryAction(prefs);
        setItinerary(result);
      } catch (error) {
        console.error("Failed to generate itinerary:", error);
        setAlert({
          isOpen: true,
          title: "Generation Failed",
          message: "We couldn't generate your itinerary. Please try again.",
          type: "error",
        });
      }
    }
    generate();
  }, [prefs, router]);

  if (!itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="loading loading-spinner text-primary loading-lg"></span>
        <p className="animate-pulse">The Architect is analyzing thousands of data points...</p>
      </div>
    );
  }

  // Minimal client-side check (simplified compared to server)
  const checkIsOpen = (vibe: Vibe, dateStr: string, startTime: string) => {
    if (!vibe.openingHours?.periods) return true;
    const date = new Date(dateStr);
    const dayIndex = date.getDay();
    const startInt = parseInt(startTime.replace(":", ""));

    // Check if there is ANY period open today covering start time
    // This is a simplified check
    const periods = vibe.openingHours.periods;
    const isOpen = periods.some((period: any) => {
      if (period.open.day !== dayIndex) return false;
      const openTime = parseInt(period.open.time);

      if (!period.close) return true; // 24h?
      if (period.close.day !== period.open.day) return startInt >= openTime; // Closes next day

      const closeTime = parseInt(period.close.time);
      return startInt >= openTime && startInt < closeTime;
    });

    return isOpen;
  };

  const handleSwap = (dayId: string, activityId: string) => {
    if (!itinerary) return;

    let warningMessage = "";

    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;

      const activityIndex = day.activities.findIndex((a) => a.id === activityId);
      if (activityIndex === -1) return day;

      const act = day.activities[activityIndex];
      if (!act.alternative) return day;

      // 1. Swap Logic
      const oldVibe = act.vibe;
      const newVibe = act.alternative;

      // 2. Check Opening Hours
      const isOpen = checkIsOpen(newVibe, day.date, act.startTime);
      if (!isOpen) {
        warningMessage = `${newVibe.title} might be closed at ${act.startTime} on this day.`;
      }

      const newActivity = {
        ...act,
        vibe: newVibe,
        alternative: oldVibe,
        note: newVibe.description,
      };

      // 3. Recalculate Transit for THIS activity (from PREV)
      // Check previous activity
      if (activityIndex > 0) {
        const prevAct = day.activities[activityIndex - 1];
        if (prevAct.vibe.lat && prevAct.vibe.lng && newVibe.lat && newVibe.lng) {
          newActivity.transitNote = getTransitNote(prevAct.vibe.lat, prevAct.vibe.lng, newVibe.lat, newVibe.lng);
        }
      }

      const updatedActivities = [...day.activities];
      updatedActivities[activityIndex] = newActivity;

      // 4. Recalculate Transit for NEXT activity (from THIS)
      if (activityIndex < updatedActivities.length - 1) {
        const nextAct = updatedActivities[activityIndex + 1];
        if (newVibe.lat && newVibe.lng && nextAct.vibe.lat && nextAct.vibe.lng) {
          const newTransit = getTransitNote(newVibe.lat, newVibe.lng, nextAct.vibe.lat, nextAct.vibe.lng);
          updatedActivities[activityIndex + 1] = { ...nextAct, transitNote: newTransit };
        }
      }

      return {
        ...day,
        activities: updatedActivities,
      };
    });

    setItinerary({ ...itinerary, days: newDays });

    if (warningMessage) {
      setAlert({
        isOpen: true,
        title: "Opening Hours Warning",
        message: warningMessage,
        type: "warning",
      });
    }
  };

  const handleRemove = (dayId: string, activityId: string) => {
    if (!itinerary) return;
    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;

      // Remove and recalc transit for the one after?
      // Simplified: Just remove. If there is a gap, transit notes might be slightly off (from prev-prev),
      // but usually the next one's transit note was "from the deleted one".
      // Ideally we should update the transit note of the activity that FOLLOWED the deleted one.

      const filtered = day.activities.filter((act) => act.id !== activityId);

      // TODO: Recalc transit for gaps? Leaving as is for minimal scope,
      // but if we remove item i, item i+1's transit note should be from i-1.

      return {
        ...day,
        activities: filtered,
      };
    });
    setItinerary({ ...itinerary, days: newDays });
  };

  const handleOpenAddModal = async (dayId: string) => {
    // Open modal immediately with loading state
    setAddModal({
      isOpen: true,
      dayId,
      suggestions: [],
      isLoading: true,
    });

    if (!itinerary) return;

    // Fetch suggestions
    try {
      const suggestions = await getActivitySuggestionsAction(prefs.cityId, itinerary, dayId);
      setAddModal((prev) => ({
        ...prev,
        suggestions,
        isLoading: false,
      }));
    } catch (e) {
      console.error(e);
      setAddModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleAddActivity = async (vibe: Vibe) => {
    if (!itinerary || !addModal.dayId) return;

    const dayId = addModal.dayId;

    // Infer time from last activity or default
    const day = itinerary.days.find((d) => d.id === dayId);
    let startTime = "12:00";
    let endTime = "13:30";

    if (day && day.activities.length > 0) {
      const lastAct = day.activities[day.activities.length - 1];
      // Simple time math: Add 30 mins travel + 90 mins duration
      const [h, m] = lastAct.endTime.split(":").map(Number);
      let newH = h + 1; // Basic increment
      let newM = m + 30; // Travel buffer
      if (newM >= 60) {
        newH++;
        newM -= 60;
      }
      startTime = `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;

      // End time + 1.5h
      let endH = newH + 1;
      let endM = newM + 30;
      if (endM >= 60) {
        endH++;
        endM -= 60;
      }
      endTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
    }

    // Create Activity
    const newActivity: TripActivity = {
      id: crypto.randomUUID(),
      vibe: vibe,
      startTime,
      endTime,
      note: vibe.description, // Or "Added manually"
      isAlternative: false,
      transitNote: "", // Will calculate below
    };

    // Calculate transit from previous
    if (day && day.activities.length > 0) {
      const lastAct = day.activities[day.activities.length - 1];
      if (lastAct.vibe.lat && lastAct.vibe.lng && vibe.lat && vibe.lng) {
        newActivity.transitNote = getTransitNote(lastAct.vibe.lat, lastAct.vibe.lng, vibe.lat, vibe.lng);
      }
    } else {
      newActivity.transitNote = "Start of day";
    }

    const newDays = itinerary.days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        activities: [...d.activities, newActivity],
      };
    });

    setItinerary({ ...itinerary, days: newDays });
    setAddModal({ ...addModal, isOpen: false });
  };

  const handleActivityUpdate = (dayId: string, activityId: string, updates: any) => {
    if (!itinerary) return;

    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;

      const newActivities = day.activities.map((act) => {
        if (act.id !== activityId) return act;
        return { ...act, ...updates };
      });

      return { ...day, activities: newActivities };
    });

    setItinerary({ ...itinerary, days: newDays });
  };

  return (
    <div className="max-w-xl mx-auto">
      <AlertModal
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />

      <AddActivityModal
        isOpen={addModal.isOpen}
        onClose={() => setAddModal({ ...addModal, isOpen: false })}
        onSelect={handleAddActivity}
        suggestions={addModal.suggestions}
        isLoading={addModal.isLoading}
      />

      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2">Your Vibe Itinerary</h1>
        <p className="text-base-content/70">Optimized for {prefs.budget} budget</p>
      </div>

      <div>
        {itinerary.days.map((day) => (
          <ItineraryDay
            key={day.id}
            day={day}
            onSwap={(actId) => handleSwap(day.id, actId)}
            onRemove={(actId) => handleRemove(day.id, actId)}
            onAdd={() => handleOpenAddModal(day.id)}
            onUpdate={(actId, updates) => handleActivityUpdate(day.id, actId, updates)}
          />
        ))}
      </div>

      <div className="divider my-8">End of Trip</div>

      <div className="flex justify-center gap-4 pb-8">
        {!hasSaved ? (
          <button
            className="btn btn-primary"
            disabled={isSaving}
            onClick={async () => {
              if (!itinerary) return;
              setIsSaving(true);
              try {
                // Persist the current state of the itinerary including edits
                await saveItineraryAction(itinerary.id, itinerary.name, itinerary);
                router.push(`/saved/${itinerary.id}`);
              } catch (e) {
                setAlert({
                  isOpen: true,
                  title: "Save Failed",
                  message: "Could not save your trip. Please try again.",
                  type: "error",
                });
                setIsSaving(false);
              }
            }}
          >
            {isSaving ? "Saving..." : "Save Trip"}
          </button>
        ) : (
          <button className="btn btn-success" disabled>
            Saved!
          </button>
        )}
        <button
          className="btn btn-neutral btn-outline"
          onClick={() => {
            prefs.reset();
            router.push("/");
          }}
        >
          Start New Trip
        </button>
      </div>
    </div>
  );
}
