import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserPreferences } from "@/lib/types";

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
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      setCity: (cityId) => set({ cityId }),
      setDates: (start, end) => set({ startDate: start, endDate: end }),
      setBudget: (budget) => set({ budget }),
      addLike: (vibeId) => set((state) => ({ likedVibes: [...state.likedVibes, vibeId] })),
      addDislike: (vibeId) => set((state) => ({ dislikedVibes: [...state.dislikedVibes, vibeId] })),
      reset: () => set(initialState),
    }),
    {
      name: "trip-vibes-storage",
    }
  )
);
