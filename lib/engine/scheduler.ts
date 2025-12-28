import { EngineCandidate, Itinerary, UserPreferences, DayPlan, TripActivity, Vibe } from "../types";
import { v4 as uuidv4 } from "uuid";
import { isMeal, isActivity, matchesNightlifePattern } from "./utils";
import { isPlaceOpenAt, calculateTransit } from "../activity";
import { addMinutesToTime, timeToMinutes, minutesToTime } from "../time";
import { getDurationForCandidate, getTimeWindows } from "./durations";

/**
 * Fixed meal slot definition.
 */
interface MealSlot {
  name: string;
  time: string;
  durationMinutes: number;
  requiredTags: string[];
}

/**
 * Time window for dynamic activity filling.
 */
interface TimeWindow {
  name: string;
  startTime: string;
  endTime: string;
  optional?: boolean;
}

const TRANSIT_BUFFER_MINUTES = 15;

export class SchedulerEngine {
  private prefs: UserPreferences;

  /**
   * Fixed meal slots - users can remove manually but we always suggest them.
   */
  private readonly MEAL_SLOTS: MealSlot[] = [
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

  constructor(prefs: UserPreferences) {
    this.prefs = prefs;
  }

  /**
   * Check if user has a foodie-oriented vibe profile.
   * Returns true if food-related weights are >= 7.
   */
  private isFoodieProfile(): boolean {
    const weights = this.prefs.vibeProfile?.weights || {};
    const foodTraits = ["food", "foodie", "culinary", "dining", "gourmet"];

    for (const trait of foodTraits) {
      if ((weights[trait] || 0) >= 7) return true;
    }
    return false;
  }

  /**
   * Maximum food-related activities per day:
   * - Foodie profile: 4 (breakfast, dinner, + 2 snack/cafes)
   * - Default: 3 (breakfast, dinner, + 1 snack)
   */
  private getMaxFoodSpotsPerDay(): number {
    if (this.isFoodieProfile()) return 4;
    return 3;
  }

  /**
   * Get activity time windows based on user's vibe profile.
   */
  private getActivityWindows(): TimeWindow[] {
    const nightlifeWeight = this.prefs.vibeProfile?.weights?.nightlife || 0;
    const { postDinner } = getTimeWindows(nightlifeWeight);

    // Morning starts after breakfast (8:00-9:00), Afternoon fills until dinner
    return [
      { name: "Morning", startTime: "09:00", endTime: "13:00" },
      { name: "Afternoon", startTime: "13:00", endTime: "19:30" },
      { name: "Evening", startTime: postDinner.start, endTime: postDinner.end, optional: true },
    ];
  }

  public assembleItinerary(candidates: EngineCandidate[]): Itinerary {
    const days: DayPlan[] = [];
    const start = new Date(this.prefs.startDate);
    const end = new Date(this.prefs.endDate);
    const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);

    // Pre-allocate candidates evenly across days to ensure balanced distribution
    const { mealCandidates, activityCandidates } = this.splitCandidates(candidates);
    const mealsPerDay = this.distributeCandidates(mealCandidates, dayCount);
    const activitiesPerDay = this.distributeCandidates(activityCandidates, dayCount);

    const globalUsedIds = new Set<string>();
    const globalUsedExternalIds = new Set<string>();

    for (let i = 0; i < dayCount; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const dayActivities: TripActivity[] = [];
      let previousLocation: { lat: number; lng: number } | null = null;

      // Use day-specific candidate pools
      const dayMeals = mealsPerDay[i] || [];
      const dayActivityPool = activitiesPerDay[i] || [];

      const usedIds = new Set<string>(globalUsedIds);
      const usedExternalIds = new Set<string>(globalUsedExternalIds);

      // 1. Schedule meals first (fixed times)
      for (const meal of this.MEAL_SLOTS) {
        const selection = this.selectMealCandidate(meal, dayMeals, usedIds, usedExternalIds, date);

        if (selection) {
          usedIds.add(selection.primary.id);
          globalUsedIds.add(selection.primary.id);
          if (selection.primary.foursquareId) {
            usedExternalIds.add(selection.primary.foursquareId);
            globalUsedExternalIds.add(selection.primary.foursquareId);
          }
          if (selection.alternative) {
            usedIds.add(selection.alternative.id);
            globalUsedIds.add(selection.alternative.id);
            if (selection.alternative.foursquareId) {
              usedExternalIds.add(selection.alternative.foursquareId);
              globalUsedExternalIds.add(selection.alternative.foursquareId);
            }
          }

          dayActivities.push(this.createMealActivity(selection.primary, meal, selection.alternative, previousLocation));

          if (selection.primary.lat && selection.primary.lng) {
            previousLocation = { lat: selection.primary.lat, lng: selection.primary.lng };
          }
        }
      }

      // 2. Fill activity windows dynamically (using day's allocation)
      // Track food spots: meals from fixed slots count toward the limit
      const maxFoodSpots = this.getMaxFoodSpotsPerDay();
      let currentFoodCount = dayActivities.length; // Fixed meal slots are all food

      const windows = this.getActivityWindows();
      for (const window of windows) {
        const windowActivities = this.fillTimeWindow(
          window,
          dayActivityPool,
          usedIds,
          usedExternalIds,
          date,
          previousLocation,
          currentFoodCount,
          maxFoodSpots
        );

        for (const act of windowActivities) {
          dayActivities.push(act);
          globalUsedIds.add(act.vibe.id);
          if (act.vibe.lat && act.vibe.lng) {
            previousLocation = { lat: act.vibe.lat, lng: act.vibe.lng };
          }
        }
      }

      // 3. Sort activities by start time
      dayActivities.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

      days.push({
        id: uuidv4(),
        dayNumber: i + 1,
        date: date.toISOString().split("T")[0],
        activities: dayActivities,
        neighborhood: "City Center",
      });
    }

    return {
      id: uuidv4(),
      cityId: this.prefs.cityId,
      days,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Split candidates into meal and activity pools.
   */
  private splitCandidates(candidates: EngineCandidate[]): {
    mealCandidates: EngineCandidate[];
    activityCandidates: EngineCandidate[];
  } {
    const mealCandidates: EngineCandidate[] = [];
    const activityCandidates: EngineCandidate[] = [];

    for (const c of candidates) {
      if (isMeal(c) && !matchesNightlifePattern(c)) {
        mealCandidates.push(c);
      }
      if (isActivity(c)) {
        activityCandidates.push(c);
      }
    }

    return { mealCandidates, activityCandidates };
  }

  /**
   * Distribute candidates evenly across days using round-robin allocation.
   */
  private distributeCandidates(candidates: EngineCandidate[], dayCount: number): EngineCandidate[][] {
    const perDay: EngineCandidate[][] = Array.from({ length: dayCount }, () => []);

    candidates.forEach((candidate, index) => {
      const dayIndex = index % dayCount;
      perDay[dayIndex].push(candidate);
    });

    return perDay;
  }

  /**
   * Dynamically fills a time window with activities based on their durations.
   * @param currentFoodCount - Number of food spots already scheduled for this day
   * @param maxFoodSpots - Maximum allowed food spots per day
   */
  private fillTimeWindow(
    window: TimeWindow,
    candidates: EngineCandidate[],
    usedIds: Set<string>,
    usedExternalIds: Set<string>,
    date: Date,
    previousLocation: { lat: number; lng: number } | null,
    currentFoodCount: number,
    maxFoodSpots: number
  ): TripActivity[] {
    const activities: TripActivity[] = [];
    let currentMinutes = timeToMinutes(window.startTime);
    const endMinutes = timeToMinutes(window.endTime);
    let foodCount = currentFoodCount;

    while (currentMinutes < endMinutes) {
      const currentTime = minutesToTime(currentMinutes);

      // Skip food candidates if we've hit the limit
      const skipFood = foodCount >= maxFoodSpots;
      const selection = this.selectActivityCandidate(candidates, usedIds, usedExternalIds, date, currentTime, skipFood);

      if (!selection) break;

      const duration = getDurationForCandidate(selection.primary);

      if (currentMinutes + duration > endMinutes) break;

      usedIds.add(selection.primary.id);
      if (selection.primary.foursquareId) usedExternalIds.add(selection.primary.foursquareId);
      if (selection.alternative) {
        usedIds.add(selection.alternative.id);
        if (selection.alternative.foursquareId) usedExternalIds.add(selection.alternative.foursquareId);
      }

      // Track food count
      if (isMeal(selection.primary)) {
        foodCount++;
      }

      const activity = this.createDynamicActivity(
        selection.primary,
        currentTime,
        duration,
        selection.alternative,
        previousLocation
      );

      activities.push(activity);

      if (selection.primary.lat && selection.primary.lng) {
        previousLocation = { lat: selection.primary.lat, lng: selection.primary.lng };
      }

      currentMinutes += duration + TRANSIT_BUFFER_MINUTES;
    }

    return activities;
  }

  /**
   * Select a meal candidate for a fixed meal slot.
   */
  private selectMealCandidate(
    meal: MealSlot,
    candidates: EngineCandidate[],
    usedIds: Set<string>,
    usedExternalIds: Set<string>,
    date: Date
  ): { primary: EngineCandidate; alternative?: EngineCandidate } | null {
    const pool = candidates.filter((c) => {
      if (usedIds.has(c.id)) return false;
      if (c.foursquareId && usedExternalIds.has(c.foursquareId)) return false;
      return true;
    });

    let primary: EngineCandidate | null = null;
    let alternative: EngineCandidate | null = null;

    for (const c of pool) {
      if (this.matchesMealSlot(c, meal) && this.isOpen(c, date, meal.time)) {
        if (!primary) {
          primary = c;
        } else if (!alternative && c.id !== primary.id) {
          alternative = c;
          break;
        }
      }
    }

    if (!primary) {
      for (const c of pool) {
        if (this.matchesMealSlot(c, meal)) {
          if (!primary) {
            primary = c;
          } else if (!alternative && c.id !== primary.id) {
            alternative = c;
            break;
          }
        }
      }
    }

    return primary ? { primary, alternative: alternative || undefined } : null;
  }

  /**
   * Select an activity candidate for dynamic window filling.
   * @param skipFood - If true, skip food-related candidates to enforce variety
   */
  private selectActivityCandidate(
    candidates: EngineCandidate[],
    usedIds: Set<string>,
    usedExternalIds: Set<string>,
    date: Date,
    time: string,
    skipFood: boolean = false
  ): { primary: EngineCandidate; alternative?: EngineCandidate } | null {
    const pool = candidates.filter((c) => {
      if (usedIds.has(c.id)) return false;
      if (c.foursquareId && usedExternalIds.has(c.foursquareId)) return false;
      // Skip food candidates if we've hit the daily limit
      if (skipFood && isMeal(c)) return false;
      return isActivity(c);
    });

    let primary: EngineCandidate | null = null;
    let alternative: EngineCandidate | null = null;

    for (const c of pool) {
      if (this.isOpen(c, date, time)) {
        if (!primary) {
          primary = c;
        } else if (!alternative && c.id !== primary.id) {
          alternative = c;
          break;
        }
      }
    }

    if (!primary) {
      for (const c of pool) {
        if (!primary) {
          primary = c;
        } else if (!alternative && c.id !== primary.id) {
          alternative = c;
          break;
        }
      }
    }

    return primary ? { primary, alternative: alternative || undefined } : null;
  }

  private matchesMealSlot(c: EngineCandidate, meal: MealSlot): boolean {
    if (matchesNightlifePattern(c)) return false;

    const cats = (c.metadata.categories || []).map((s: string) => s.toLowerCase());
    const name = c.name.toLowerCase();
    const combined = [...cats, name].join(" ");

    if (meal.requiredTags.some((tag) => combined.includes(tag))) return true;
    return isMeal(c);
  }

  private isOpen(candidate: EngineCandidate, date: Date, timeStr: string): boolean {
    return isPlaceOpenAt(candidate.openingHours, date, timeStr);
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

  private createDynamicActivity(
    c: EngineCandidate,
    startTime: string,
    durationMinutes: number,
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
      startTime,
      endTime: addMinutesToTime(startTime, durationMinutes),
      note: `Explore ${c.name}.`,
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
