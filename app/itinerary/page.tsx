"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { generateItineraryAction, saveItineraryAction } from "@/lib/db-actions";
import { Itinerary } from "@/lib/types";
import ItineraryDay from "@/components/ItineraryDay";

export default function ItineraryPage() {
  const router = useRouter();
  const prefs = useStore();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

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

  const handleSwap = (dayId: string, activityId: string) => {
    if (!itinerary) return;
    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;
      return {
        ...day,
        activities: day.activities.map((act) => {
          if (act.id !== activityId || !act.alternative) return act;
          const oldVibe = act.vibe;
          const newVibe = act.alternative;
          return {
            ...act,
            vibe: newVibe,
            alternative: oldVibe,
            note: newVibe.description,
          };
        }),
      };
    });
    setItinerary({ ...itinerary, days: newDays });
  };

  const handleRemove = (dayId: string, activityId: string) => {
    if (!itinerary) return;
    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;
      return {
        ...day,
        activities: day.activities.filter((act) => act.id !== activityId),
      };
    });
    setItinerary({ ...itinerary, days: newDays });
  };

  const handleAdd = (dayId: string) => {
    if (!itinerary) return;
    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;
      const newActivity = {
        id: crypto.randomUUID(),
        vibe: {
          id: "custom",
          title: "New Activity",
          description: "Description",
          imageUrl: "",
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

  return (
    <div className="max-w-xl mx-auto">
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

              // Persist the current state of the itinerary including edits
              await saveItineraryAction(itinerary.id, itinerary.name, itinerary);

              setHasSaved(true);
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
