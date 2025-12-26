export interface City {
  id: string;
  name: string;
  country: string;
  slug: string; // e.g., 'amsterdam'
}

export type VibeCategory = "nature" | "architecture" | "food" | "nightlife" | "culture" | "history" | "hidden-gem";

export interface Vibe {
  id: string; // UUID or Slug
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  cityId: string;
  tags: string[];
  // Metadata for the Architect
  neighborhood?: string;
  durationMinutes?: number; // Avg time spent
  openingHour?: number; // 24h format, e.g., 9
  closingHour?: number; // 24h format, e.g., 18
  bestTimeOfDay?: "morning" | "afternoon" | "evening";
  priceLevel?: number; // 1-4
  lat?: number;
  lng?: number;
}

export interface TripActivity {
  id: string;
  vibe: Vibe;
  startTime: string; // "10:00"
  endTime: string; // "12:00"
  note: string; // "Walk 15 mins along the canal"
  isAlternative: boolean;
  transitNote?: string; // e.g., "15 min walk"
  alternative?: {
    title: string;
    note: string;
  };
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  date: string;
  activities: TripActivity[];
  neighborhood: string;
}

export interface Itinerary {
  id: string;
  cityId: string;
  days: DayPlan[];
  createdAt: string;
}

export interface UserPreferences {
  cityId: string;
  startDate: string;
  endDate: string;
  budget: "low" | "medium" | "high";
  likedVibes: string[]; // IDs of liked vibes
  dislikedVibes: string[];
}
