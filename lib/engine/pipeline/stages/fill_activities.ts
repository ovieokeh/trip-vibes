import { PlannerStage, ScheduleState } from "../types";
import { UserPreferences, EngineCandidate, TripActivity, Vibe } from "../../../types";
import { isActivity, isMeal } from "../../utils";
import { v4 as uuidv4 } from "uuid";
import { addMinutesToTime, timeToMinutes, minutesToTime } from "../../../time";
import { calculateTransit } from "../../../activity";
import { calculateHaversineDistance } from "../../../geo";
import { getDurationForCandidate } from "../../durations";

const TRANSIT_BUFFER_MINUTES = 15;
const MAX_ITERATIONS_PER_GAP = 20; // Safety guard against infinite loops

export class FillActivitiesStage implements PlannerStage {
  name = "FillActivities";

  async run(state: ScheduleState, prefs: UserPreferences): Promise<ScheduleState> {
    const newState = { ...state };

    for (const day of newState.days) {
      // Sort existing activities (meals) by time
      day.activities.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

      const filledActivities: TripActivity[] = [];
      let lastEndTimeMinutes = timeToMinutes("09:00"); // Start day at 9 AM (after breakfast)
      let lastLocation: { lat: number; lng: number } | null = null;

      // Find gaps between existing activities and fill them
      for (let i = 0; i <= day.activities.length; i++) {
        const nextActivity = day.activities[i];

        // Define Gap end
        const gapEndMinutes = nextActivity ? timeToMinutes(nextActivity.startTime) : timeToMinutes("19:30"); // End at Dinner time

        // If next activity is breakfast (e.g. 8am), skip
        if (gapEndMinutes < lastEndTimeMinutes) {
          if (nextActivity) {
            filledActivities.push(nextActivity);
            lastEndTimeMinutes = timeToMinutes(nextActivity.endTime);
            if (nextActivity.vibe.lat && nextActivity.vibe.lng) {
              lastLocation = { lat: nextActivity.vibe.lat, lng: nextActivity.vibe.lng };
            }
          }
          continue;
        }

        // Fill the Gap - TIME-BASED (no arbitrary budget limits)
        const gapAvailable = gapEndMinutes - lastEndTimeMinutes;
        if (gapAvailable > 60) {
          const newItems = this.fillGap(day, lastEndTimeMinutes, gapEndMinutes, newState, lastLocation);
          filledActivities.push(...newItems);

          // Update last location from new items if any
          if (newItems.length > 0) {
            const lastItem = newItems[newItems.length - 1];
            if (lastItem.vibe.lat && lastItem.vibe.lng) {
              lastLocation = { lat: lastItem.vibe.lat, lng: lastItem.vibe.lng };
            }
            lastEndTimeMinutes = timeToMinutes(lastItem.endTime);
          }
        }

        // Add the anchor activity (if exists)
        if (nextActivity) {
          filledActivities.push(nextActivity);
          lastEndTimeMinutes = timeToMinutes(nextActivity.endTime);
          if (nextActivity.vibe.lat && nextActivity.vibe.lng) {
            lastLocation = { lat: nextActivity.vibe.lat, lng: nextActivity.vibe.lng };
          }
        }
      }

      // Post-Dinner / Nightlife Filling?
      // We could handle that here or in a separate stage.
      // For now, let's leave it simple.

      day.activities = filledActivities;
    }

    return newState;
  }

  private fillGap(
    day: any, // or DayPlan
    startMinutes: number,
    endMinutes: number,
    state: ScheduleState,
    startLocation: { lat: number; lng: number } | null
  ): TripActivity[] {
    const added: TripActivity[] = [];
    let currentMinutes = startMinutes;
    // Safety buffer: leave 15 mins before next anchor
    const effectiveEnd = endMinutes - 15;

    let currentLocation = startLocation;
    let iterations = 0;

    const usedCategories = new Set<string>();
    day.activities.forEach((a: TripActivity) => {
      if (a.vibe.category) usedCategories.add(a.vibe.category.toLowerCase());
    });

    // TIME-BASED filling with safety guard
    while (currentMinutes < effectiveEnd && iterations < MAX_ITERATIONS_PER_GAP) {
      iterations++;

      const candidates = state.remainingCandidates.filter(
        (c) =>
          !state.usedIds.has(c.id) && (!c.foursquareId || !state.usedExternalIds.has(c.foursquareId)) && isActivity(c)
      );

      if (candidates.length === 0) {
        console.warn(`[FillActivities] Day ${day.dayNumber}: No activity candidates left`);
        break;
      }

      // Score candidates based on proximity to currentLocation AND variety
      const scored = candidates.map((c) => {
        let score = c._score || 0;

        // Proximity Boost
        if (currentLocation && c.lat && c.lng) {
          const dist = calculateHaversineDistance(currentLocation.lat, currentLocation.lng, c.lat, c.lng);
          if (dist < 2.0) score += 20;
          else if (dist < 5.0) score += 10;
        }

        // Variety Penalty
        const primaryCat = (c.metadata as any)?.categories?.[0]?.toLowerCase();
        if (primaryCat && usedCategories.has(primaryCat)) {
          score -= 30; // -30 penalty for repeat categories
        }

        return { c, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const selection = scored[0].c;

      const duration = getDurationForCandidate(selection);

      if (currentMinutes + duration > effectiveEnd) break;

      // Add it
      state.usedIds.add(selection.id);
      if (selection.foursquareId) state.usedExternalIds.add(selection.foursquareId);

      const activity = this.createActivity(selection, minutesToTime(currentMinutes), duration, currentLocation);
      added.push(activity);

      // Track category for variety penalty
      if (selection.metadata?.categories?.[0]) {
        usedCategories.add(selection.metadata.categories[0].toLowerCase());
      }

      if (selection.lat && selection.lng) {
        currentLocation = { lat: selection.lat, lng: selection.lng };
      }

      currentMinutes += duration + TRANSIT_BUFFER_MINUTES;
    }

    return added;
  }

  private createActivity(
    c: EngineCandidate,
    startTime: string,
    durationMinutes: number,
    previousLocation: { lat: number; lng: number } | null
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
      startTime,
      endTime: addMinutesToTime(startTime, durationMinutes),
      note: `Explore ${c.name}.`,
      transitDetails,
      transitNote,
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
