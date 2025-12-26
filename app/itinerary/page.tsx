"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { generateItineraryAction, saveItineraryAction, getFallbackImageAction } from "@/lib/db-actions";
import { Itinerary, TripActivity, Vibe } from "@/lib/types";
import ItineraryDay from "@/components/ItineraryDay";
import AlertModal from "@/components/AlertModal";
import { getTransitNote } from "@/lib/geo";

export default function ItineraryPage() {
  const router = useRouter();
  const prefs = useStore();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

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

  const handleAdd = async (dayId: string) => {
    if (!itinerary) return;

    // Fetch generic image
    const imageUrl = await getFallbackImageAction("travel");

    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;
      const newActivity = {
        id: crypto.randomUUID(),
        vibe: {
          id: "custom",
          title: "New Activity",
          description: "Description",
          imageUrl: imageUrl, // Use fetched image
          category: "custom",
          cityId: process.env.NEXT_PUBLIC_DEFAULT_CITY_ID || "",
          tags: [],
        } as any,
        startTime: "12:00",
        endTime: "13:00",
        note: "Added manually",
        isAlternative: false,
      };
      return {
        ...day,
        activities: [...day.activities, newActivity],
      };
    });
    setItinerary({ ...itinerary, days: newDays });
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
            onAdd={() => handleAdd(day.id)}
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
                setHasSaved(true);
                setAlert({
                  isOpen: true,
                  title: "Saved!",
                  message: "Your trip has been saved successfully.",
                  type: "success",
                });
              } catch (e) {
                setAlert({
                  isOpen: true,
                  title: "Save Failed",
                  message: "Could not save your trip. Please try again.",
                  type: "error",
                });
              }
              setIsSaving(false);
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
