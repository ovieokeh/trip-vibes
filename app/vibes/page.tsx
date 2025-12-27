"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import SwipeCard from "@/components/SwipeCard";
import { AnimatePresence, motion } from "framer-motion";
import { Vibe } from "@/lib/types";
import { DeckEngine } from "@/lib/vibes/deck";

export default function VibesPage() {
  const router = useRouter();
  const { cityId, addLike, addDislike, vibeProfile, likedVibes, dislikedVibes } = useStore();
  const [currentCard, setCurrentCard] = useState<AppVibe | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Initialize Engine
  const engine = useMemo(() => {
    return new DeckEngine([...likedVibes, ...dislikedVibes]);
  }, [likedVibes, dislikedVibes]);

  // Load next card
  useEffect(() => {
    if (!cityId) return;

    // Safety check: if we have 6 likes, finish
    if (likedVibes.length >= 6) {
      finishVibeCheck();
      return;
    }

    const nextArchetype = engine.getNextCard(vibeProfile);

    if (nextArchetype) {
      const vibe: AppVibe = {
        id: nextArchetype.id,
        title: nextArchetype.title,
        description: nextArchetype.description,
        imageUrl: nextArchetype.imageUrl || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1", // Fallback
        category: nextArchetype.category,
        cityId: cityId,
        tags: nextArchetype.tags,
        lat: 0,
        lng: 0,
      };
      setCurrentCard(vibe);
    } else {
      // No more cards
      finishVibeCheck();
    }
  }, [vibeProfile, engine, cityId]);

  const finishVibeCheck = () => {
    setIsFinishing(true);
    setTimeout(() => {
      router.push("/itinerary");
    }, 1500);
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentCard) return;

    // Optimistic UI: Remove card immediately
    const id = currentCard.id;
    setCurrentCard(null); // Clear to trigger next load

    if (direction === "right") {
      addLike(id);
    } else {
      addDislike(id);
    }
  };

  // Vibe Meter Logic
  const topTraits = Object.entries(vibeProfile.weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // Redirect if no city
  useEffect(() => {
    if (!cityId) router.push("/");
  }, [cityId, router]);

  if (!cityId) return null;

  if (isFinishing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Vibe Check Complete!</h2>
        <div className="text-xl opacity-80 mb-8">Building your unique itinerary...</div>
        <div className="flex gap-2 flex-wrap justify-center">
          {topTraits.map(([trait, score]) => (
            <span key={trait} className="badge badge-lg badge-primary capitalize">
              {trait}
            </span>
          ))}
        </div>
        <span className="loading loading-dots loading-lg mt-8"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 overflow-hidden relative">
      <div className="absolute top-4 w-full px-4 flex justify-between items-center text-xs opacity-70 uppercase tracking-widest">
        <span>Vibe Check</span>
        <span>{likedVibes.length} / 6</span>
      </div>

      <div className="absolute top-12 w-full flex justify-center gap-2 px-4 h-8">
        <AnimatePresence>
          {topTraits.map(([trait, score], i) => (
            <motion.div
              key={trait}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              className={`badge badge-ghost transition-colors duration-300 ${score > 5 ? "badge-primary" : ""}`}
            >
              {trait}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative w-full max-w-sm h-[60vh] mt-8">
        <AnimatePresence mode="wait">
          {currentCard && <SwipeCard key={currentCard.id} vibe={currentCard} onSwipe={handleSwipe} />}
        </AnimatePresence>
      </div>

      {currentCard && (
        <div className="mt-8 text-center text-sm opacity-70 animate-pulse">Swipe right for YES, left for NO</div>
      )}
    </div>
  );
}

interface AppVibe extends Vibe {}
