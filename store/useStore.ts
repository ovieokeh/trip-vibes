import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserPreferences } from "@/lib/types";

import { DeckEngine } from "@/lib/vibes/deck";
import { VibeProfile } from "@/lib/vibes/types";

interface AppState extends UserPreferences {
  // Actions
  setCity: (cityId: string) => void;
  setDates: (start: string, end: string) => void;
  setBudget: (budget: "low" | "medium" | "high") => void;
  addLike: (vibeId: string) => void;
  addDislike: (vibeId: string) => void;
  reset: () => void;
}

const initialState: UserPreferences = {
  cityId: "",
  startDate: "",
  endDate: "",
  budget: "medium",
  likedVibes: [],
  dislikedVibes: [],
  vibeProfile: { weights: {}, swipes: 0 },
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      setCity: (cityId) => set({ cityId }),
      setDates: (start, end) => set({ startDate: start, endDate: end }),
      setBudget: (budget) => set({ budget }),
      addLike: (vibeId) =>
        set((state) => ({
          likedVibes: [...state.likedVibes, vibeId],
          vibeProfile: DeckEngine.updateProfile(state.vibeProfile, vibeId, true),
        })),
      addDislike: (vibeId) =>
        set((state) => ({
          dislikedVibes: [...state.dislikedVibes, vibeId],
          vibeProfile: DeckEngine.updateProfile(state.vibeProfile, vibeId, false),
        })),
      reset: () => set(initialState),
    }),
    {
      name: "trip-vibes-storage",
    }
  )
);
