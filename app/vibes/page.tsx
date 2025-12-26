"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { VIBES } from "@/lib/data";
import SwipeCard from "@/components/SwipeCard";
import { AnimatePresence } from "framer-motion";

export default function VibesPage() {
  const router = useRouter();
  const { cityId, addLike, addDislike } = useStore();
  const [cards, setCards] = useState(() => {
    // Filter vibes by selected city
    return VIBES.filter((v) => v.cityId === cityId);
  });

  // If no city selected (e.g. refresh), redirect home
  useEffect(() => {
    if (!cityId) {
      router.push("/");
    }
  }, [cityId, router]);

  const handleSwipe = (id: string, direction: "left" | "right") => {
    if (direction === "right") {
      addLike(id);
    } else {
      addDislike(id);
    }

    // Remove card from stack
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  // When stack is empty, go to itinerary
  useEffect(() => {
    if (cityId && cards.length === 0) {
      // Small delay for UX
      const timeout = setTimeout(() => {
        router.push("/itinerary");
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [cards, cityId, router]);

  if (!cityId) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] overflow-hidden">
      {cards.length > 0 ? (
        <div className="relative w-full max-w-sm h-[60vh]">
          <AnimatePresence>
            {cards.map(
              (vibe, index) =>
                // Only render top 2 cards for performance, but we need to reverse map to show top first in DOM stacking?
                // Actually absolute positioning stacks them. Last in DOM is on top.
                // So we want the first element of array to be on top? Or last?
                // Let's assume cards[0] is top.
                // We only render the first one or two.
                index <= 1 && (
                  <SwipeCard
                    key={vibe.id}
                    vibe={vibe}
                    onSwipe={(dir) => handleSwipe(vibe.id, dir)}
                    style={{ zIndex: cards.length - index }}
                  />
                )
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="text-xl font-medium">Generating your itinerary...</p>
        </div>
      )}

      <div className="mt-8 text-center text-sm opacity-50">Swipe right to like, left to pass</div>
    </div>
  );
}
