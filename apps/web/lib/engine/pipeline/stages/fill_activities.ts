import { PlannerStage, ScheduleState } from "../types";
import { UserPreferences, EngineCandidate, TripActivity, Vibe } from "../../../types";
import { isActivity, isMeal } from "../../utils";
import { v4 as uuidv4 } from "uuid";
import { addMinutesToTime, timeToMinutes, minutesToTime } from "../../../time";
import { calculateTransit } from "../../../activity";
import { calculateHaversineDistance, getCenterFrictionPenalty } from "../../../geo";
import { getDurationForCandidate } from "../../durations";
import { DiversityTracker } from "../../diversity";
import { calculateSunsetTime, isOpenAt, getOutdoorTimePenalty, getSeasonPenalty } from "../../time_windows";
import { assignZones, getZoneChangePenalty } from "../../clustering";
import { isThinPOI, countHighQualityPOIs } from "../../poi_quality";

const TRANSIT_BUFFER_MINUTES = 15;
const MAX_ITERATIONS_PER_GAP = 20; // Safety guard against infinite loops
const MAX_ZONE_CHANGES_PER_DAY = 2; // Limit zigzag across city
const MAX_THIN_POI_PER_DAY = 2; // Cap low-value POIs
const COZY_CATEGORIES = ["cafe", "coffee", "bakery", "bar", "brewery", "bookstore", "spa", "lounge"];

export class FillActivitiesStage implements PlannerStage {
  name = "FillActivities";

  async run(state: ScheduleState, prefs: UserPreferences): Promise<ScheduleState> {
    const newState = { ...state };
    const cityCenter = state.cityCoordinates || { lat: 50, lng: 14 }; // Default to Prague-ish if missing
    const clusteredCandidates = assignZones(state.originalCandidates, cityCenter);

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
          const newItems = this.fillGap(
            day,
            lastEndTimeMinutes,
            gapEndMinutes,
            newState,
            lastLocation,
            clusteredCandidates,
            cityCenter
          );
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
    startLocation: { lat: number; lng: number } | null,
    clusteredCandidates: any[],
    cityCenter: { lat: number; lng: number }
  ): TripActivity[] {
    const added: TripActivity[] = [];
    let currentMinutes = startMinutes;
    // Safety buffer: leave 15 mins before next anchor
    const effectiveEnd = endMinutes - 15;

    let currentLocation = startLocation;
    let iterations = 0;

    const diversityTracker = new DiversityTracker();
    // Pre-populate with existing activities (e.g. meals already anchored)
    day.activities.forEach((a: TripActivity) => {
      diversityTracker.record(a.vibe.category ? [a.vibe.category] : []);
    });

    const tripDate = new Date(day.date);
    const cityLat = state.cityCoordinates?.lat || 50; // Fallback to center-ish Europe
    const sunsetTime = calculateSunsetTime(cityLat, tripDate);
    const sunsetMinutes = timeToMinutes(sunsetTime);
    const dayOfWeek = tripDate.getDay();

    // Zone Tracking
    let currentZone = "center";
    if (startLocation) {
      const assigned = assignZones([{ lat: startLocation.lat, lng: startLocation.lng } as any], cityCenter);
      currentZone = assigned[0].zoneId;
    }

    // Realism Tracking
    let zoneChanges = 0;
    let thinPoiCount = 0;

    // Fallback: if pool is >50% thin, relax the cap
    const activityCandidates = state.remainingCandidates.filter((c) => !state.usedIds.has(c.id) && isActivity(c));
    const highQualityCount = countHighQualityPOIs(activityCandidates);
    const relaxThinLimit = highQualityCount < activityCandidates.length * 0.5;

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

        // Proximity Boost & Logistics Penalties
        if (currentLocation && c.lat && c.lng) {
          const dist = calculateHaversineDistance(currentLocation.lat, currentLocation.lng, c.lat, c.lng);

          // Graduated proximity scoring
          if (dist < 1.0) score += 40; // Walking distance - big bonus
          else if (dist < 2.0) score += 25; // Short transit
          else if (dist < 4.0) score += 10; // Medium distance
          else if (dist < 8.0) score -= 20; // Far - penalty
          else score -= 50; // Very far - heavy penalty (cross-city)

          // Anchor distance rule: if far from previous, require higher base score to justify the trip
          if (dist > 5.0 && (c._score || 0) < 50) {
            score -= 30; // Penalty for low-value distant items
          }
        }

        // Dynamic Diversity Penalty
        const cats = c.metadata?.categories || [];
        score -= diversityTracker.getPenalty(cats);

        // Time Window Penalty (Sunset)
        score -= getOutdoorTimePenalty(c, currentMinutes, sunsetMinutes);

        // Opening Hours Check
        if (!isOpenAt(c, dayOfWeek, minutesToTime(currentMinutes))) {
          score -= 100; // Heavy penalty for closed venues
        }

        // Pre-calculated Zone Penalty
        const candidateZone = clusteredCandidates.find((cc) => cc.candidate.id === c.id)?.zoneId || "unknown";
        score -= getZoneChangePenalty(currentZone, candidateZone);

        // Matinee Penalty: Discourage indoor seated activities before 2pm (840 mins)
        if (currentMinutes < 840) {
          const matineeCats = ["cinema", "movie", "theater", "nightlife", "bar", "club", "performing arts"];
          const isMatinee = cats.some((cat) => matineeCats.some((m) => cat.toLowerCase().includes(m)));
          if (isMatinee) {
            score -= 50;
          }
        }

        // ========== REALISM IMPROVEMENTS ==========

        // Zone Change Limit: Penalize if we've already hit max zone changes
        if (candidateZone !== currentZone && zoneChanges >= MAX_ZONE_CHANGES_PER_DAY) {
          score -= 80; // Strong discouragement after max zone changes
        }

        // Thin POI Cap: Penalize low-value POIs after cap reached
        if (isThinPOI(c) && thinPoiCount >= MAX_THIN_POI_PER_DAY && !relaxThinLimit) {
          score -= 60;
        }

        // Season Penalty: Discourage beaches/outdoor in winter
        score -= getSeasonPenalty(c, tripDate);

        // Evening Cozy Boost: Prefer cafes/bars in 16:00-19:00 window
        if (currentMinutes >= 960 && currentMinutes < 1140) {
          const catsLower = cats.join(" ").toLowerCase();
          const isCozy = COZY_CATEGORIES.some((cat) => catsLower.includes(cat));
          if (isCozy) {
            score += 30;
          }
        }

        return { c, score, candidateZone };
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

      // Track category for diversity penalty
      diversityTracker.record(selection.metadata?.categories || []);

      // Track thin POI usage
      if (isThinPOI(selection)) {
        thinPoiCount++;
      }

      // Track zone changes
      const selectedZone = scored[0].candidateZone;
      if (selectedZone !== currentZone) {
        zoneChanges++;
        currentZone = selectedZone;
      }

      if (selection.lat && selection.lng) {
        currentLocation = { lat: selection.lat, lng: selection.lng };
      }

      // Apply city center friction penalty for driving
      const friction = getCenterFrictionPenalty(currentZone, selectedZone);
      currentMinutes += duration + TRANSIT_BUFFER_MINUTES + friction;
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
