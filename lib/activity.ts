/**
 * Shared Activity Utilities
 *
 * Centralizes activity scheduling, transit calculation, and opening hours logic.
 * Used by both the engine (generation) and editor (UI).
 *
 * @module lib/activity
 */

import { DayPlan, TripActivity, Vibe, TransitDetails } from "./types";
import { getTravelDetails, getTransitNote } from "./geo";
import { calculateNextActivityTime, DEFAULT_FIRST_ACTIVITY_START, DEFAULT_FIRST_ACTIVITY_END, timeToInt } from "./time";
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// TRANSIT CALCULATION
// ============================================================================

/**
 * Calculates transit details between two locations.
 * Wraps geo.ts functions to provide a unified interface.
 */
export function calculateTransit(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): { transitNote: string; transitDetails: TransitDetails } {
  return {
    transitNote: getTransitNote(fromLat, fromLng, toLat, toLng),
    transitDetails: getTravelDetails(fromLat, fromLng, toLat, toLng),
  };
}

/**
 * Recalculates transit for all activities in a list based on their order.
 * The first activity has no transit (or "Start of day").
 * Subsequent activities calculate transit from the previous activity's location.
 *
 * This is the SINGLE SOURCE OF TRUTH for transit recalculation.
 * Use this after any operation that changes activity order or location.
 */
export function recalculateTransitForActivities(activities: TripActivity[]): TripActivity[] {
  return activities.map((act, index) => {
    if (index === 0) {
      // First activity of the day - no transit needed
      return { ...act, transitNote: undefined, transitDetails: undefined };
    }

    const prev = activities[index - 1];
    if (prev.vibe.lat && prev.vibe.lng && act.vibe.lat && act.vibe.lng) {
      const { transitNote, transitDetails } = calculateTransit(
        prev.vibe.lat,
        prev.vibe.lng,
        act.vibe.lat,
        act.vibe.lng
      );
      return { ...act, transitNote, transitDetails };
    }

    // No location data - clear transit
    return { ...act, transitNote: undefined, transitDetails: undefined };
  });
}

// ============================================================================
// OPENING HOURS
// ============================================================================

type OpeningHours = Vibe["openingHours"];

/**
 * Checks if a place is open at a specific date and time.
 *
 * Handles:
 * - Normal hours (open and close on same day)
 * - Overnight venues (e.g., bar open 22:00-02:00)
 * - Places with no closing time (24h)
 * - Missing opening hours data (assumes open)
 *
 * This is the SINGLE SOURCE OF TRUTH for opening hours checks.
 *
 * @param openingHours - The place's opening hours object
 * @param date - The date to check
 * @param timeStr - Time in "HH:MM" format
 * @returns true if open, false if closed
 */
export function isPlaceOpenAt(openingHours: OpeningHours, date: Date, timeStr: string): boolean {
  // Assume open if no data OR if periods array is empty
  if (!openingHours?.periods || openingHours.periods.length === 0) return true;

  const dayIndex = date.getDay(); // 0 = Sunday
  const timeInt = timeToInt(timeStr);

  return openingHours.periods.some((period) => {
    const openTime = parseInt(period.open.time, 10);

    // No close time = 24 hours
    if (!period.close) {
      return period.open.day === dayIndex && timeInt >= openTime;
    }

    const closeTime = parseInt(period.close.time, 10);

    // Case 1: Normal hours (opens and closes same day)
    if (period.open.day === period.close.day) {
      return period.open.day === dayIndex && timeInt >= openTime && timeInt < closeTime;
    }

    // Case 2: Overnight venue (e.g., opens Sat 22:00, closes Sun 02:00)
    // Check if we're on the opening day after open time
    if (period.open.day === dayIndex && timeInt >= openTime) {
      return true;
    }

    // Check if we're on the closing day before close time
    if (period.close.day === dayIndex && timeInt < closeTime) {
      return true;
    }

    return false;
  });
}

// ============================================================================
// ACTIVITY SCHEDULING
// ============================================================================

/**
 * Creates a new TripActivity from a Vibe with calculated times and transit.
 *
 * @param vibe - The place/vibe to create an activity for
 * @param startTime - Start time in "HH:MM" format
 * @param endTime - End time in "HH:MM" format
 * @param previousActivity - The previous activity (for transit calculation)
 */
export function createTripActivity(
  vibe: Vibe,
  startTime: string,
  endTime: string,
  previousActivity?: TripActivity
): TripActivity {
  let transitNote: string | undefined;
  let transitDetails: TransitDetails | undefined;

  if (previousActivity?.vibe.lat && previousActivity?.vibe.lng && vibe.lat && vibe.lng) {
    const transit = calculateTransit(previousActivity.vibe.lat, previousActivity.vibe.lng, vibe.lat, vibe.lng);
    transitNote = transit.transitNote;
    transitDetails = transit.transitDetails;
  }

  return {
    id: uuidv4(),
    vibe,
    startTime,
    endTime,
    note: vibe.description,
    isAlternative: false,
    transitNote,
    transitDetails,
  };
}

/**
 * Appends a new activity to a day's activities with correct timing and transit.
 * Returns the updated activities array.
 *
 * This is the SINGLE SOURCE OF TRUTH for adding activities.
 *
 * @param day - The day to append to
 * @param vibe - The vibe/place to add
 * @returns Updated activities array with the new activity
 */
export function appendActivityToDay(day: DayPlan, vibe: Vibe): TripActivity[] {
  const existingActivities = day.activities;

  let startTime: string;
  let endTime: string;
  let previousActivity: TripActivity | undefined;

  if (existingActivities.length > 0) {
    // Calculate times based on last activity
    previousActivity = existingActivities[existingActivities.length - 1];
    const times = calculateNextActivityTime(previousActivity.endTime);
    startTime = times.startTime;
    endTime = times.endTime;
  } else {
    // First activity of the day
    startTime = DEFAULT_FIRST_ACTIVITY_START;
    endTime = DEFAULT_FIRST_ACTIVITY_END;
  }

  const newActivity = createTripActivity(vibe, startTime, endTime, previousActivity);

  return [...existingActivities, newActivity];
}

/**
 * Moves an activity from one day to another.
 * Recalculates transit for both source and target days.
 * Recalculates times for the moved activity based on target day.
 *
 * This is the SINGLE SOURCE OF TRUTH for moving activities between days.
 *
 * @param sourceDayId - ID of the day to move FROM
 * @param targetDayId - ID of the day to move TO
 * @param activityId - ID of the activity to move
 * @param days - Array of all days
 * @returns Updated days array, or null if move failed
 */
export function moveActivityBetweenDays(
  sourceDayId: string,
  targetDayId: string,
  activityId: string,
  days: DayPlan[]
): DayPlan[] | null {
  if (sourceDayId === targetDayId) return null;

  const sourceDay = days.find((d) => d.id === sourceDayId);
  const targetDay = days.find((d) => d.id === targetDayId);
  const activity = sourceDay?.activities.find((a) => a.id === activityId);

  if (!sourceDay || !targetDay || !activity) return null;

  // 1. Remove from source day
  const newSourceActivities = sourceDay.activities.filter((a) => a.id !== activityId);
  const updatedSourceActivities = recalculateTransitForActivities(newSourceActivities);

  // 2. Calculate new times for moved activity based on target day
  let newStartTime: string;
  let newEndTime: string;
  let previousActivity: TripActivity | undefined;

  if (targetDay.activities.length > 0) {
    previousActivity = targetDay.activities[targetDay.activities.length - 1];
    const times = calculateNextActivityTime(previousActivity.endTime);
    newStartTime = times.startTime;
    newEndTime = times.endTime;
  } else {
    newStartTime = DEFAULT_FIRST_ACTIVITY_START;
    newEndTime = DEFAULT_FIRST_ACTIVITY_END;
  }

  // 3. Create updated activity with new times
  const movedActivity: TripActivity = {
    ...activity,
    startTime: newStartTime,
    endTime: newEndTime,
    transitNote: undefined,
    transitDetails: undefined,
  };

  // 4. Add to target day and recalculate transit
  const newTargetActivities = [...targetDay.activities, movedActivity];
  const updatedTargetActivities = recalculateTransitForActivities(newTargetActivities);

  // 5. Return updated days
  return days.map((d) => {
    if (d.id === sourceDayId) return { ...d, activities: updatedSourceActivities };
    if (d.id === targetDayId) return { ...d, activities: updatedTargetActivities };
    return d;
  });
}

/**
 * Swaps an activity's primary vibe with its alternative.
 * Recalculates transit for the swapped activity and the next activity.
 *
 * @param day - The day containing the activity
 * @param activityId - ID of the activity to swap
 * @returns Updated activities array, or null if swap failed
 */
export function swapActivityAlternative(day: DayPlan, activityId: string): TripActivity[] | null {
  const activityIndex = day.activities.findIndex((a) => a.id === activityId);
  if (activityIndex === -1) return null;

  const activity = day.activities[activityIndex];
  if (!activity.alternative) return null;

  const oldVibe = activity.vibe;
  const newVibe = activity.alternative;

  // Create swapped activity
  const swappedActivity: TripActivity = {
    ...activity,
    vibe: newVibe,
    alternative: oldVibe,
    note: newVibe.description,
  };

  // Update activities array
  const updatedActivities = [...day.activities];
  updatedActivities[activityIndex] = swappedActivity;

  // Recalculate transit for the whole day (simplest approach, handles all edge cases)
  return recalculateTransitForActivities(updatedActivities);
}
