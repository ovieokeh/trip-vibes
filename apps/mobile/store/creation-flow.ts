import { create } from "zustand";
import { Vibe } from "@trip-vibes/shared";

interface CreationFlowState {
  // Trip Details
  cityId: string | null;
  startDate: Date | null;
  endDate: Date | null;

  // Vibe Selection
  likedVibes: string[];
  dislikedVibes: string[];

  // Actions
  setCityId: (id: string) => void;
  setDates: (start: Date, end: Date) => void;
  likeVibe: (vibeId: string) => void;
  dislikeVibe: (vibeId: string) => void;
  resetFlow: () => void;
}

export const useCreationFlow = create<CreationFlowState>((set) => ({
  cityId: "amsterdam", // Default for now
  startDate: null,
  endDate: null,
  likedVibes: [],
  dislikedVibes: [],

  setCityId: (id) => set({ cityId: id }),
  setDates: (start, end) => set({ startDate: start, endDate: end }),

  likeVibe: (vibeId) =>
    set((state) => ({
      likedVibes: [...state.likedVibes, vibeId],
    })),

  dislikeVibe: (vibeId) =>
    set((state) => ({
      dislikedVibes: [...state.dislikedVibes, vibeId],
    })),

  resetFlow: () =>
    set({
      cityId: "amsterdam",
      startDate: null,
      endDate: null,
      likedVibes: [],
      dislikedVibes: [],
    }),
}));
