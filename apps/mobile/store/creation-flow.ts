import { create } from "zustand";
import { Vibe, DeckEngine, VibeProfile } from "@trip-vibes/shared";

interface CreationFlowState {
  // Trip Details
  cityId: string | null;
  startDate: Date | null;
  endDate: Date | null;

  // Vibe Selection
  likedVibes: string[];
  dislikedVibes: string[];
  vibeProfile: VibeProfile;

  // Actions
  setCityId: (id: string) => void;
  setDates: (start: Date, end: Date) => void;
  likeVibe: (vibeId: string) => void;
  dislikeVibe: (vibeId: string) => void;
  resetFlow: () => void;
}

export const useCreationFlow = create<CreationFlowState>((set) => ({
  cityId: null,
  startDate: null,
  endDate: null,
  likedVibes: [],
  dislikedVibes: [],
  vibeProfile: { weights: {}, swipes: 0 },

  setCityId: (id) => set({ cityId: id }),
  setDates: (start, end) => set({ startDate: start, endDate: end }),

  likeVibe: (vibeId) =>
    set((state) => ({
      likedVibes: [...state.likedVibes, vibeId],
      vibeProfile: DeckEngine.updateProfile(state.vibeProfile, vibeId, true),
    })),

  dislikeVibe: (vibeId) =>
    set((state) => ({
      dislikedVibes: [...state.dislikedVibes, vibeId],
      vibeProfile: DeckEngine.updateProfile(state.vibeProfile, vibeId, false),
    })),

  resetFlow: () =>
    set({
      cityId: null,
      startDate: null,
      endDate: null,
      likedVibes: [],
      dislikedVibes: [],
      vibeProfile: { weights: {}, swipes: 0 },
    }),
}));
