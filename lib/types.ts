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
  website?: string;
  phone?: string;
  openingHours?: {
    open_now: boolean;
    periods: Array<{
      close: { day: number; time: string };
      open: { day: number; time: string };
    }>;
    weekday_text: string[];
  };
  photoUrls?: string[]; // Kept for backward compat or quick access
  photos?: Array<{
    height: number;
    width: number;
    html_attributions: string[];
    photo_reference: string;
    url?: string;
  }>;
  rating?: number;
  address?: string;
  distanceFromContext?: number;
}

export interface TransitDetails {
  mode: "walking" | "driving" | "transit";
  durationMinutes: number;
  distanceKm: number;
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
}

export interface TripActivity {
  id: string;
  vibe: Vibe;
  startTime: string; // "10:00"
  endTime: string; // "12:00"
  note: string; // "Walk 15 mins along the canal"
  transitNote?: string; // e.g., "15 min walk"
  transitDetails?: TransitDetails;
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
  name?: string;
  startDate?: string;
  endDate?: string;
}

import { VibeProfile } from "./vibes/types";

export interface UserPreferences {
  cityId: string;
  startDate: string;
  endDate: string;
  budget: "low" | "medium" | "high";
  likedVibes: string[]; // IDs of liked vibes (Keep for legacy/debugging)
  dislikedVibes: string[];
  vibeProfile: VibeProfile; // The new weighted profile
  forceRefresh?: boolean; // When true, bypass caches and fetch fresh results
}

export interface GooglePlacePrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GooglePlaceDetails {
  address_components: GoogleAddressComponent[];
  formatted_address: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface EngineCandidate {
  id: string;
  foursquareId: string | null;
  googlePlacesId: string | null;
  cityId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  website: string | null;
  phone: string | null;
  imageUrl: string | null;
  photos?: Array<{
    height: number;
    width: number;
    html_attributions: string[];
    photo_reference: string;
    url?: string | undefined;
  }>;
  openingHours?: {
    open_now: boolean;
    periods: Array<{ close: { day: number; time: string }; open: { day: number; time: string } }>;
    weekday_text: string[];
  };
  metadata: {
    categories: string[];
    categoryId?: string;
    source: string;
    website: string | null;
    phone: string | null;
    neighborhood?: string;
  };
  _score?: number;
}
