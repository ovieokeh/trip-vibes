import { EngineCandidate, Itinerary, UserPreferences, DayPlan, TripActivity, Vibe } from "../types";
import { v4 as uuidv4 } from "uuid";
import { isMeal, isActivity, matchesNightlifePattern } from "./utils";
import { isPlaceOpenAt, calculateTransit } from "../activity";
import { addMinutesToTime } from "../time";

interface TimeSlot {
  name: string;
  time: string;
  type: "meal" | "activity";
  durationMinutes: number;
  requiredTags?: string[]; // e.g. "breakfast"
  optional?: boolean;
}

export class SchedulerEngine {
  private prefs: UserPreferences;

  // Using the North Star structure: [Breakfast, Activities, Lunch, Activities, Dinner, Activities]
  private readonly DAILY_TEMPLATE: TimeSlot[] = [
    {
      name: "Breakfast",
      time: "09:00",
      type: "meal",
      durationMinutes: 60,
      requiredTags: ["breakfast", "cafe", "bakery"],
    },
    { name: "Morning Discovery", time: "10:30", type: "activity", durationMinutes: 120 },
    { name: "Lunch", time: "13:00", type: "meal", durationMinutes: 90, requiredTags: ["restaurant", "food", "diner"] },
    { name: "Afternoon Adventure", time: "15:00", type: "activity", durationMinutes: 180 },
    {
      name: "Dinner",
      time: "19:30",
      type: "meal",
      durationMinutes: 120,
      requiredTags: ["restaurant", "dinner", "steakhouse"],
    },
    { name: "Evening Vibe", time: "22:00", type: "activity", durationMinutes: 120, optional: true },
  ];

  constructor(prefs: UserPreferences) {
    this.prefs = prefs;
  }

  public assembleItinerary(candidates: EngineCandidate[]): Itinerary {
    const days: DayPlan[] = [];
    const start = new Date(this.prefs.startDate);
    const end = new Date(this.prefs.endDate);
    const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);

    const usedIds = new Set<string>();
    const usedExternalIds = new Set<string>();

    // Deep copy candidates to avoid mutation issues if any
    const availableCandidates = [...candidates];

    for (let i = 0; i < dayCount; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const dayActivities: TripActivity[] = [];
      let previousLocation: { lat: number; lng: number } | null = null;

      for (const slot of this.DAILY_TEMPLATE) {
        const selection = this.selectForSlot(slot, availableCandidates, usedIds, usedExternalIds, date);

        // Skip optional slots if no candidates found
        if (!selection && slot.optional) {
          continue;
        }

        if (selection && selection.primary) {
          usedIds.add(selection.primary.id);
          if (selection.primary.foursquareId) usedExternalIds.add(selection.primary.foursquareId);

          if (selection.alternative) {
            usedIds.add(selection.alternative.id);
            if (selection.alternative.foursquareId) usedExternalIds.add(selection.alternative.foursquareId);
          }

          const activity = this.createActivity(selection.primary, slot, selection.alternative, previousLocation);

          dayActivities.push(activity);

          // Update previous location to the current activity's location
          if (activity.vibe.lat && activity.vibe.lng) {
            previousLocation = { lat: activity.vibe.lat, lng: activity.vibe.lng };
          }
        }
      }

      days.push({
        id: uuidv4(),
        dayNumber: i + 1,
        date: date.toISOString().split("T")[0],
        activities: dayActivities,
        neighborhood: "City Center", // TODO: Dynamic neighborhood grouping
      });
    }

    return {
      id: uuidv4(),
      cityId: this.prefs.cityId,
      days,
      createdAt: new Date().toISOString(),
    };
  }

  private selectForSlot(
    slot: TimeSlot,
    candidates: EngineCandidate[],
    usedIds: Set<string>,
    usedExternalIds: Set<string>,
    date: Date
  ): { primary: EngineCandidate; alternative?: EngineCandidate } | null {
    // Filter candidates valid for this slot
    const pool = candidates.filter((c) => {
      if (usedIds.has(c.id)) return false;
      if (c.foursquareId && usedExternalIds.has(c.foursquareId)) return false;
      return true;
    });

    let primary: EngineCandidate | null = null;
    let alternative: EngineCandidate | null = null;

    // Priority 1: High Score + Matches Slot Type + Open
    for (const c of pool) {
      if (this.matchesSlotType(c, slot) && this.isOpen(c, date, slot.time)) {
        if (!primary) {
          primary = c;
        } else {
          // Check if distinct from primary
          if (c.id === primary.id) continue;
          if (c.foursquareId && primary.foursquareId && c.foursquareId === primary.foursquareId) continue;

          alternative = c;
          break; // Found both
        }
      }
    }

    if (!primary || !alternative) {
      // Priority 2: Matches Slot Type, IGNORE opening hours entirely
      // This is a fallback when Priority 1's strict opening hours filter was too restrictive
      for (const c of pool) {
        if (this.matchesSlotType(c, slot)) {
          if (!primary) {
            primary = c;
          } else {
            // Must be distinct
            if (c.id === primary.id) continue;
            if (c.foursquareId && primary.foursquareId && c.foursquareId === primary.foursquareId) continue;

            // Avoid overwriting if we already found a valid alternative in Priority 1
            if (!alternative) {
              alternative = c;
              break;
            }
          }
        }
      }
    }

    return primary ? { primary, alternative: alternative || undefined } : null;
  }

  private matchesSlotType(c: EngineCandidate, slot: TimeSlot): boolean {
    if (slot.type === "meal") {
      // Exclude nightlife venues from meal slots (bars, pubs, clubs should be activities)
      if (matchesNightlifePattern(c)) return false;

      const cats = (c.metadata.categories || []).map((s: string) => s.toLowerCase());
      const name = c.name.toLowerCase();
      const combined = [...cats, name].join(" ");

      if (slot.requiredTags) {
        if (slot.requiredTags.some((tag) => combined.includes(tag))) return true;
      }
      return isMeal(c);
    } else {
      return isActivity(c);
    }
  }

  /**
   * Check if a candidate is open at the given date and time.
   * Uses the shared isPlaceOpenAt utility for consistent behavior.
   */
  private isOpen(candidate: EngineCandidate, date: Date, timeStr: string): boolean {
    // Delegate to shared utility
    return isPlaceOpenAt(candidate.openingHours, date, timeStr);
  }

  private createActivity(
    c: EngineCandidate,
    slot: TimeSlot,
    alternativeCandidate?: EngineCandidate,
    previousLocation?: { lat: number; lng: number } | null
  ): TripActivity {
    let transitDetails = undefined;
    let transitNote = undefined;

    // Use shared transit calculation
    if (previousLocation && c.lat && c.lng) {
      const transit = calculateTransit(previousLocation.lat, previousLocation.lng, c.lat, c.lng);
      transitDetails = transit.transitDetails;
      transitNote = transit.transitNote;
    }

    return {
      id: uuidv4(),
      vibe: this.mapCandidateToVibe(c),
      startTime: slot.time,
      endTime: addMinutesToTime(slot.time, slot.durationMinutes), // Use shared utility
      note: `Enjoy ${slot.name} at ${c.name}.`,
      isAlternative: false,
      transitNote,
      transitDetails,
      alternative: alternativeCandidate ? this.mapCandidateToVibe(alternativeCandidate) : undefined,
    };
  }

  private mapCandidateToVibe(p: EngineCandidate): Vibe {
    return {
      id: p.id,
      title: p.name,
      description: p.address || "",
      imageUrl: p.imageUrl || "",
      category: (p.metadata as any)?.categories?.[0] || "POI",
      cityId: p.cityId,
      tags: [],
      lat: p.lat,
      lng: p.lng,
      website: p.website || undefined,
      phone: p.phone || undefined,
      openingHours: p.openingHours || undefined,
      photos:
        p.photos?.map((photo) => ({
          ...photo,
          url: photo.url || (photo.photo_reference ? `/api/places/photo?ref=${photo.photo_reference}` : ""),
        })) || [],
      rating: p.rating ?? undefined,
      address: p.address ?? undefined,
    };
  }
}
