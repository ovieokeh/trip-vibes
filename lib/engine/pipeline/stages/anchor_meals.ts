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
    const { startDate, endDate } = prefs;

    // We iterate through each day in the plan
    for (let i = 0; i < newState.days.length; i++) {
      const day = newState.days[i];
      const dayActivities = [...day.activities]; // Copy existing (likely empty)

      let previousLocation: { lat: number; lng: number } | null = null;
      // In a real pipeline, we might have activities already.
      // For anchors, we usually start fresh or interleave.
      // We'll assume we are adding to the list.

      // Filter candidates for this day (exclude used)
      const dayPool = newState.remainingCandidates.filter(
        (c) => !newState.usedIds.has(c.id) && (!c.foursquareId || !newState.usedExternalIds.has(c.foursquareId))
      );

      for (const meal of MEAL_SLOTS) {
        // Re-filter pool to exclude candidates used in previous slots of the SAME day
        const currentPool = dayPool.filter(
          (c) => !newState.usedIds.has(c.id) && (!c.foursquareId || !newState.usedExternalIds.has(c.foursquareId))
        );

        const selection = this.selectMealCandidate(meal, currentPool);

        if (selection) {
          // Mark as used
          newState.usedIds.add(selection.primary.id);
          if (selection.primary.foursquareId) {
            newState.usedExternalIds.add(selection.primary.foursquareId);
          }
          if (selection.alternative) {
            newState.usedIds.add(selection.alternative.id);
            if (selection.alternative.foursquareId) {
              newState.usedExternalIds.add(selection.alternative.foursquareId);
            }
          }

          // Create Activity
          const activity = this.createMealActivity(selection.primary, meal, selection.alternative, previousLocation);
          dayActivities.push(activity);

          if (selection.primary.lat && selection.primary.lng) {
            previousLocation = { lat: selection.primary.lat, lng: selection.primary.lng };
          }
        }
      }

      // Update the day
      day.activities = dayActivities;
    }

    return newState;
  }

  private selectMealCandidate(
    meal: MealSlot,
    candidates: EngineCandidate[]
  ): { primary: EngineCandidate; alternative?: EngineCandidate } | null {
    // 1. Strict Match
    let strictPool = candidates.filter((c) => this.matchesMealSlot(c, meal, true));
    if (strictPool.length === 0) {
      // 2. Loose Match
      strictPool = candidates.filter((c) => this.matchesMealSlot(c, meal, false));
    }

    // Sort by score? Or assume they come sorted?
    // Let's assume input is sorted by score (engine usually does this)
    // We could re-sort here if needed.

    if (strictPool.length === 0) return null;

    const primary = strictPool[0];

    // Only pick an alternative if we have a healthy pool left
    // AND it matches the current meal slot (avoid stealing other meal types)
    const alternative = strictPool.find(
      (c) =>
        c.id !== primary.id && (!c.foursquareId || c.foursquareId !== primary.foursquareId) && strictPool.length > 2 // We have at least one other strict match for this type
    );

    return { primary, alternative };
  }

  private matchesMealSlot(c: EngineCandidate, meal: MealSlot, strict: boolean): boolean {
    // Basic exclusions
    if (meal.name !== "Dinner" && matchesNightlifePattern(c)) return false;

    if (strict) {
      const cats = (c.metadata?.categories || []).map((s: string) => s.toLowerCase());
      const name = c.name.toLowerCase();
      const combined = [...cats, name].join(" ");
      return meal.requiredTags.some((tag) => combined.includes(tag));
    }

    return isMeal(c);
  }

  private createMealActivity(
    c: EngineCandidate,
    meal: MealSlot,
    alternativeCandidate?: EngineCandidate,
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
