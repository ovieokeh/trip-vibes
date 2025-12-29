import { EngineCandidate } from "../types";
import { timeToMinutes } from "../time";

/**
 * Calculates approximate sunset time based on latitude and day of year.
 * Uses simplified solar declination formula - accurate to within ~15 minutes.
 *
 * Works for any city worldwide without hardcoded regional data.
 *
 * @param latitude - City latitude (-90 to 90)
 * @param date - The date to calculate sunset for
 * @returns Sunset time in "HH:MM" format (local solar time)
 */
export function calculateSunsetTime(latitude: number, date: Date): string {
  const dayOfYear = getDayOfYear(date);

  // Solar declination angle (simplified formula)
  const declination = 23.45 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));

  // Convert to radians
  const latRad = latitude * (Math.PI / 180);
  const decRad = declination * (Math.PI / 180);

  // Hour angle at sunset
  const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);

  // Handle polar day/night (midnight sun or polar night)
  if (cosHourAngle < -1) {
    return "23:59"; // Midnight sun - sun doesn't set
  }
  if (cosHourAngle > 1) {
    return "12:00"; // Polar night - use noon as fallback
  }

  const hourAngle = Math.acos(cosHourAngle);
  const hourAngleDegrees = hourAngle * (180 / Math.PI);

  // Solar noon is 12:00, sunset is half the day length after solar noon
  const sunsetHour = 12 + hourAngleDegrees / 15; // 15 degrees per hour

  const hours = Math.floor(sunsetHour);
  const minutes = Math.round((sunsetHour - hours) * 60);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Gets the day of year (1-365/366).
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Checks if a venue is outdoor-focused using Foursquare category names.
 */
export function isOutdoorVenue(c: EngineCandidate): boolean {
  const cats = (c.metadata?.categories || []).join(" ").toLowerCase();
  const outdoorPatterns = [
    "park",
    "garden",
    "plaza",
    "beach",
    "trail",
    "hiking",
    "viewpoint",
    "scenic",
    "outdoor",
    "bridge",
    "marina",
    "monument",
    "landmark",
    "square",
    "promenade",
    "waterfront",
  ];
  return outdoorPatterns.some((p) => cats.includes(p));
}

/**
 * Checks if venue is open at a specific day/time.
 * Returns true if no opening hours data (assume open).
 */
export function isOpenAt(c: EngineCandidate, dayOfWeek: number, time: string): boolean {
  if (!c.openingHours?.periods || c.openingHours.periods.length === 0) {
    return true; // No data = assume open
  }

  // 24h Check (Google format: day 0, time 0000, no close)
  if (
    c.openingHours.periods.length === 1 &&
    c.openingHours.periods[0].open.day === 0 &&
    c.openingHours.periods[0].open.time === "0000" &&
    !c.openingHours.periods[0].close
  ) {
    return true;
  }

  const timeMinutes = timeToMinutes(time);

  for (const period of c.openingHours.periods) {
    if (period.open.day === dayOfWeek) {
      const openMinutes = parseInt(period.open.time.slice(0, 2)) * 60 + parseInt(period.open.time.slice(2));

      // If close is missing but it's open today, assume it doesn't close today (or at least not before we care)
      if (!period.close) {
        if (timeMinutes >= openMinutes) return true;
        continue;
      }

      const closeMinutes = parseInt(period.close.time.slice(0, 2)) * 60 + parseInt(period.close.time.slice(2));

      // Handle overnight hours (close < open means crosses midnight)
      if (closeMinutes < openMinutes) {
        if (timeMinutes >= openMinutes || timeMinutes < closeMinutes) {
          return true;
        }
      } else {
        if (timeMinutes >= openMinutes && timeMinutes < closeMinutes) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Calculates time-based penalty for outdoor venues near/after sunset.
 */
export function getOutdoorTimePenalty(
  c: EngineCandidate,
  scheduledTimeMinutes: number,
  sunsetTimeMinutes: number
): number {
  if (!isOutdoorVenue(c)) return 0;

  const minutesToSunset = sunsetTimeMinutes - scheduledTimeMinutes;

  if (minutesToSunset > 90) return 0; // More than 1.5h before sunset - fine
  if (minutesToSunset > 30) return 20; // 30-90min before sunset - slight penalty
  if (minutesToSunset > 0) return 40; // Less than 30min before sunset - moderate penalty
  return 80; // After sunset - heavy penalty (but not absolute veto)
}

/**
 * Winter months (0-indexed) when outdoor activities are less suitable.
 */
const WINTER_MONTHS = [11, 0, 1, 2]; // Nov, Dec, Jan, Feb

/**
 * Categories particularly affected by cold/winter weather.
 */
const COLD_SENSITIVE_CATEGORIES = ["beach", "surf", "lake", "swimming", "water park"];

/**
 * Calculates season-based penalty for outdoor venues in winter.
 * Beaches and water activities get heavy penalty; parks/gardens get light penalty.
 */
export function getSeasonPenalty(c: EngineCandidate, tripDate: Date): number {
  const month = tripDate.getMonth();
  if (!WINTER_MONTHS.includes(month)) return 0;

  const cats = (c.metadata?.categories || []).join(" ").toLowerCase();

  // Beach/water activities are especially bad in winter
  if (COLD_SENSITIVE_CATEGORIES.some((cat) => cats.includes(cat))) {
    return 60; // Heavy penalty
  }

  // General outdoor venues get light penalty in winter
  if (isOutdoorVenue(c)) {
    return 25;
  }

  return 0;
}
