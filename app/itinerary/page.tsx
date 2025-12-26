"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { generateItinerary } from "@/lib/architect";
import { Itinerary } from "@/lib/types";
import ItineraryDay from "@/components/ItineraryDay";

export default function ItineraryPage() {
  const router = useRouter();
  const prefs = useStore();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    // Basic protection to ensure we have a city selected
    if (!prefs.cityId) {
      router.push("/");
      return;
    }

    // Generate Itinerary (Simulation of AI Architect)
    const result = generateItinerary(prefs);
    setItinerary(result);
  }, [prefs, router]);

  if (!itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="loading loading-spinner text-primary loading-lg"></span>
        <p className="animate-pulse">The Architect is analyzing thousands of data points...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2">Your Vibe Itinerary</h1>
        <p className="text-base-content/70">Optimized for {prefs.budget} budget</p>
      </div>

      <div>
        {itinerary.days.map((day) => (
          <ItineraryDay key={day.dayNumber} day={day} />
        ))}
      </div>

      <div className="divider my-8">End of Trip</div>

      <div className="flex justify-center pb-8">
        <button
          className="btn btn-neutral btn-wide"
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
