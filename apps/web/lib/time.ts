/**
 * Shared Time Utilities
 *
 * Centralizes all time-related calculations for activity scheduling.
 * Used by both the engine (generation) and editor (UI).
 *
 * @module lib/time
 */

/**
 * Parses a time string "HH:MM" into total minutes since midnight.
 */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Alias for parseTimeToMinutes for more readable code.
 */
export const timeToMinutes = parseTimeToMinutes;

/**
 * Converts total minutes (can exceed 1440) to "HH:MM" format.
 * Handles midnight rollover by wrapping to next day.
 *
 * @example
 * minutesToTime(1440) // "00:00" (next day midnight)
 * minutesToTime(1500) // "01:00" (next day 1am)
 * minutesToTime(90)   // "01:30"
 */
export function minutesToTime(totalMinutes: number): string {
  // Normalize to 24-hour cycle (handle negative and > 24h)
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Adds minutes to a time string, handling midnight rollover.
 *
 * @example
 * addMinutesToTime("23:30", 90) // "01:00" (next day)
 * addMinutesToTime("12:00", 60) // "13:00"
 */
export function addMinutesToTime(time: string, mins: number): string {
  const totalMinutes = parseTimeToMinutes(time) + mins;
  return minutesToTime(totalMinutes);
}

/**
 * Calculates end time given a start time and duration.
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  return addMinutesToTime(startTime, durationMinutes);
}

/** Default gap between activities in minutes */
export const DEFAULT_ACTIVITY_GAP_MINUTES = 30;

/** Default activity duration in minutes */
export const DEFAULT_ACTIVITY_DURATION_MINUTES = 90;

/**
 * Calculates the start and end time for a new activity based on the last activity's end time.
 * Applies a gap (default 30 min) before the new activity starts.
 *
 * @param lastEndTime - The end time of the last activity in "HH:MM" format
 * @param gapMinutes - Gap between activities (default 30)
 * @param durationMinutes - Duration of the new activity (default 90)
 * @returns Object with startTime and endTime
 *
 * @example
 * calculateNextActivityTime("14:00") // { startTime: "14:30", endTime: "16:00" }
 * calculateNextActivityTime("23:30") // { startTime: "00:00", endTime: "01:30" } (next day)
 */
export function calculateNextActivityTime(
  lastEndTime: string,
  gapMinutes: number = DEFAULT_ACTIVITY_GAP_MINUTES,
  durationMinutes: number = DEFAULT_ACTIVITY_DURATION_MINUTES
): { startTime: string; endTime: string } {
  const startTime = addMinutesToTime(lastEndTime, gapMinutes);
  const endTime = addMinutesToTime(startTime, durationMinutes);
  return { startTime, endTime };
}

/**
 * Default times for the first activity of a day (no previous activity).
 */
export const DEFAULT_FIRST_ACTIVITY_START = "12:00";
export const DEFAULT_FIRST_ACTIVITY_END = "13:30";

/**
 * Parses a time string to an integer for comparison with opening hours.
 * "09:30" -> 930, "13:00" -> 1300
 */
export function timeToInt(time: string): number {
  return parseInt(time.replace(":", ""), 10);
}
