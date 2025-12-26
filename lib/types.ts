export interface City {
  id: string;
  name: string;
  country: string;
  slug: string; // e.g., 'amsterdam'
}

export type VibeCategory = "nature" | "architecture" | "food" | "nightlife" | "culture" | "history" | "hidden-gem";

export interface Vibe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: VibeCategory;
  cityId: string;
  tags: string[];
  // Metadata for the Architect
  neighborhood: string;
  durationMinutes: number; // Avg time spent
  openingHour?: number; // 24h format, e.g., 9
  closingHour?: number; // 24h format, e.g., 18
  bestTimeOfDay: "morning" | "afternoon" | "evening" | "any";
  priceLevel: 1 | 2 | 3 | 4; // $-$$$$
  lat: number;
  lng: number;
}

export interface DayActivity {
  id: string;
  vibe: Vibe;
  startTime: string; // "10:00"
  endTime: string; // "12:00"
  note?: string; // "Walk 15 mins along the canal"
  isAlternative: boolean;
}

export interface DayPlan {
  dayNumber: number;
  date: string;
  activities: DayActivity[];
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
