import { PlannerStage, ScheduleState } from "../types";
import { UserPreferences, EngineCandidate, TripActivity, Vibe } from "../../../types";
import { isMeal, matchesNightlifePattern } from "../../utils";
import { v4 as uuidv4 } from "uuid";
import { addMinutesToTime, timeToMinutes } from "../../../time";
import { calculateTransit } from "../../../activity";

interface MealSlot {
  name: string;
  time: string;
  durationMinutes: number;
  requiredTags: string[];
}

const MEAL_SLOTS: MealSlot[] = [
  {
    name: "Breakfast",
    time: "08:00",
    durationMinutes: 60,
    requiredTags: ["breakfast", "cafe", "bakery"],
  },
  {
    name: "Dinner",
    time: "19:30",
    durationMinutes: 90,
    requiredTags: ["restaurant", "dinner", "steakhouse"],
  },
];

export class AnchorMealsStage implements PlannerStage {
  name = "AnchorMeals";

  async run(state: ScheduleState, prefs: UserPreferences): Promise<ScheduleState> {
    const newState = { ...state };

    for (const day of newState.days) {
      const dayActivities = [...day.activities];
      let previousLocation: { lat: number; lng: number } | null = null;

      for (const meal of MEAL_SLOTS) {
        // Filter pool from the latest remainingCandidates in state
        const selection = this.selectMealCandidate(meal, newState.remainingCandidates);

        if (selection) {
          // Mark as used in sets
          newState.usedIds.add(selection.id);
          if (selection.foursquareId) {
            newState.usedExternalIds.add(selection.foursquareId);
          }

          // Also remove from remainingCandidates to preserve the pool for subsequent days/stages
          newState.remainingCandidates = newState.remainingCandidates.filter(
            (c) => c.id !== selection.id && (!c.foursquareId || c.foursquareId !== selection.foursquareId)
          );

          // Create Activity
          const activity = this.createMealActivity(selection, meal, previousLocation);
          dayActivities.push(activity);

          if (selection.lat && selection.lng) {
            previousLocation = { lat: selection.lat, lng: selection.lng };
          }
        }
      }

      // Update the day
      day.activities = dayActivities;
    }

    return newState;
  }

  private selectMealCandidate(meal: MealSlot, candidates: EngineCandidate[]): EngineCandidate | null {
    // 1. Strict Match: specific tags (bakery for breakfast, etc)
    let pool = candidates.filter((c) => this.matchesMealSlot(c, meal, "strict"));
    if (pool.length > 0) return pool[0];

    // 2. Loose Match: isMeal() utility (any restaurant/cafe/bar)
    pool = candidates.filter((c) => this.matchesMealSlot(c, meal, "loose"));
    if (pool.length > 0) return pool[0];

    // 3. Relaxed Match: any candidate that isn't explicitly an activity
    // (Last resort, in case classification is weird)
    pool = candidates.filter((c) => this.matchesMealSlot(c, meal, "relaxed"));
    if (pool.length > 0) return pool[0];

    return null;
  }

  private matchesMealSlot(c: EngineCandidate, meal: MealSlot, level: "strict" | "loose" | "relaxed"): boolean {
    // Basic exclusions: No nightlife for breakfast
    if (meal.name !== "Dinner" && matchesNightlifePattern(c)) return false;

    if (level === "strict") {
      const cats = (c.metadata?.categories || []).map((s: string) => s.toLowerCase());
      const name = c.name.toLowerCase();
      const combined = [...cats, name].join(" ");
      return meal.requiredTags.some((tag) => combined.includes(tag));
    }

    if (level === "loose") {
      return isMeal(c);
    }

    if (level === "relaxed") {
      // Not an explicit activity = potential meal
      // We exclude hybrids here as well to be safe
      const cats = (c.metadata?.categories || []).map((s: string) => s.toLowerCase());
      const name = c.name.toLowerCase();
      const combined = [...cats, name].join(" ");
      const isExplicitActivity =
        combined.includes("park") ||
        combined.includes("museum") ||
        combined.includes("monument") ||
        combined.includes("gallery") ||
        combined.includes("theater") ||
        combined.includes("cinema") ||
        combined.includes("movie");
      return !isExplicitActivity;
    }

    return false;
  }

  private createMealActivity(
    c: EngineCandidate,
    meal: MealSlot,
    previousLocation?: { lat: number; lng: number } | null
  ): TripActivity {
    let transitDetails = undefined;
    let transitNote = undefined;

    if (previousLocation && c.lat && c.lng) {
      const transit = calculateTransit(previousLocation.lat, previousLocation.lng, c.lat, c.lng);
      transitDetails = transit.transitDetails;
      transitNote = transit.transitNote;
    }

    return {
      id: uuidv4(),
      vibe: this.mapCandidateToVibe(c),
      startTime: meal.time,
      endTime: addMinutesToTime(meal.time, meal.durationMinutes),
      note: `Enjoy ${meal.name} at ${c.name}.`,
      transitNote,
      transitDetails,
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
