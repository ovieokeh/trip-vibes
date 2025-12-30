import { create } from "zustand";
import { City, DeckEngine, VibeProfile } from "@trip-vibes/shared";

interface CreationFlowState {
  // Trip Details
  city: City | null;
  startDate: Date | null;
  endDate: Date | null;

  // Vibe Selection
  likedVibes: string[];
  dislikedVibes: string[];
  vibeProfile: VibeProfile;

  // Actions
  setCity: (city: City) => void;
  setDates: (start: Date, end: Date) => void;
  likeVibe: (vibeId: string) => void;
  dislikeVibe: (vibeId: string) => void;
  resetFlow: () => void;
}

export const useCreationFlow = create<CreationFlowState>((set) => ({
  city: null,
  startDate: null,
  endDate: null,
  likedVibes: [],
  dislikedVibes: [],
  vibeProfile: { weights: {}, swipes: 0 },

  setCity: (city) => set({ city }),
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
      city: null,
      startDate: null,
      endDate: null,
      likedVibes: [],
      dislikedVibes: [],
      vibeProfile: { weights: {}, swipes: 0 },
    }),
}));
