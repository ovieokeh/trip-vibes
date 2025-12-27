import { EngineCandidate, Itinerary, UserPreferences, DayPlan, TripActivity, Vibe } from "../types";
import { v4 as uuidv4 } from "uuid";
import { getTravelDetails, getTransitNote } from "../geo";

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
    let availableCandidates = [...candidates];

    for (let i = 0; i < dayCount; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const dayActivities: TripActivity[] = [];
      let previousLocation: { lat: number; lng: number } | null = null; // Track previous location for transit

      for (const slot of this.DAILY_TEMPLATE) {
        // Determine candidate(s) - now returns { primary, alternative? }
        const selection = this.selectForSlot(slot, availableCandidates, usedIds, usedExternalIds, date);

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
      // Priority 2: Matches Slot Type (Ignore Opening Hours if missing data)
      for (const c of pool) {
        if (this.matchesSlotType(c, slot)) {
          if (!c.openingHours || this.isOpen(c, date, slot.time)) {
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
    }

    return primary ? { primary, alternative: alternative || undefined } : null;
  }

  private matchesSlotType(c: EngineCandidate, slot: TimeSlot): boolean {
    const cats = (c.metadata.categories || []).map((s) => s.toLowerCase());
    const name = c.name.toLowerCase();
    const combined = [...cats, name].join(" ");

    if (slot.type === "meal") {
      if (slot.requiredTags) {
        return slot.requiredTags.some((tag) => combined.includes(tag));
      }
      return /restaurant|cafe|food|bakery|bistro|diner|steakhouse/.test(combined);
    } else {
      // Activity (Exclude pure food places unless it's a market)
      const isFood = /restaurant|cafe|bistro|steakhouse/.test(combined) && !/market|hall/.test(combined);
      return !isFood;
    }
  }

  private isOpen(candidate: EngineCandidate, date: Date, timeStr: string): boolean {
    if (!candidate.openingHours?.periods) return true; // Assume open if no data

    const day = date.getDay();
    const time = parseInt(timeStr.replace(":", ""));

    return candidate.openingHours.periods.some((p) => {
      const openTime = parseInt(p.open.time);
      const closeTime = p.close ? parseInt(p.close.time) : 2359;

      if (p.open.day === day) {
        // Normal case
        if (p.close && parseInt(p.close.time) < openTime) {
          // Closes next day
          return time >= openTime;
        }
        return time >= openTime && (p.close ? time < closeTime : true);
      }

      // Prev day wrap
      const prevDay = (day + 6) % 7;
      if (p.open.day === prevDay && p.close && parseInt(p.close.time) < parseInt(p.open.time)) {
        return time < parseInt(p.close.time);
      }

      return false;
    });
  }

  private createActivity(
    c: EngineCandidate,
    slot: TimeSlot,
    alternativeCandidate?: EngineCandidate,
    previousLocation?: { lat: number; lng: number } | null
  ): TripActivity {
    let transitDetails = undefined;
    let transitNote = undefined;

    if (previousLocation && c.lat && c.lng) {
      transitDetails = getTravelDetails(previousLocation.lat, previousLocation.lng, c.lat, c.lng);
      transitNote = getTransitNote(previousLocation.lat, previousLocation.lng, c.lat, c.lng);
    }

    return {
      id: uuidv4(),
      vibe: this.mapCandidateToVibe(c),
      startTime: slot.time,
      endTime: this.addMinutes(slot.time, slot.durationMinutes),
      note: `Enjoy ${slot.name} at ${c.name}.`,
      isAlternative: false,
      transitNote,
      transitDetails,
      alternative: alternativeCandidate ? this.mapCandidateToVibe(alternativeCandidate) : undefined,
    };
  }

  private addMinutes(time: string, mins: number): string {
    const [h, m] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m + mins);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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
