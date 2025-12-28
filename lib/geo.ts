import { TransitDetails } from "./types";

export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Circuity factor: ratio of actual road/path distance to straight-line distance.
 * Research shows urban areas typically have 1.2-1.4 circuity.
 * We use 1.3 as a balanced default that matches Google Maps well in most cities.
 *
 * Source: Urban planning studies show average circuity of ~1.3 for walking
 * and ~1.25 for driving in developed cities.
 */
const CIRCUITY_FACTOR = 1.3;

/**
 * Buffer time (minutes) added to account for:
 * - Traffic lights and crossings
 * - Wayfinding/navigation in unfamiliar areas
 * - Building entry/exit (finding entrance, elevators, etc.)
 */
const WALKING_BUFFER_MIN = 2;
const DRIVING_BUFFER_MIN = 3; // Parking + walking from car

export function estimateTravelTime(distanceKm: number, mode: "walking" | "driving" | "transit"): number {
  // More conservative speeds based on real-world urban travel
  const walkingSpeedKmH = 4.8; // Standard urban walking speed (approx 3 mph)
  const drivingSpeedKmH = 25.0; // Urban average including traffic lights
  const transitSpeedKmH = 18.0; // Bus/metro with stops and transfers

  let speed = walkingSpeedKmH;
  let bufferMin = WALKING_BUFFER_MIN;

  if (mode === "driving") {
    speed = drivingSpeedKmH;
    bufferMin = DRIVING_BUFFER_MIN;
  }
  if (mode === "transit") {
    speed = transitSpeedKmH;
    bufferMin = WALKING_BUFFER_MIN; // Still need to walk to/from stops
  }

  // Apply circuity factor to convert straight-line to estimated route distance
  const routeDistanceKm = distanceKm * CIRCUITY_FACTOR;
  const timeHours = routeDistanceKm / speed;
  const travelMinutes = Math.ceil(timeHours * 60);

  // Add buffer and ensure minimum reasonable time
  return Math.max(travelMinutes + bufferMin, mode === "walking" ? 3 : 5);
}

/**
 * Walking vs driving threshold in kilometers.
 * Used by both getTransitNote and getTravelDetails for consistency.
 */
const WALKING_THRESHOLD_KM = 1.5;

export function getTransitNote(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  const dist = calculateHaversineDistance(fromLat, fromLng, toLat, toLng);

  if (dist < WALKING_THRESHOLD_KM) {
    const mins = estimateTravelTime(dist, "walking");
    return `${mins} min walk`;
  } else {
    const mins = estimateTravelTime(dist, "driving");
    return `${mins} min drive`;
  }
}

export function getTravelDetails(fromLat: number, fromLng: number, toLat: number, toLng: number): TransitDetails {
  const dist = calculateHaversineDistance(fromLat, fromLng, toLat, toLng);

  // Default mode logic - uses same threshold as getTransitNote
  let mode: "walking" | "driving" = "walking";
  if (dist >= WALKING_THRESHOLD_KM) mode = "driving";

  // Calculate duration for default mode
  const duration = estimateTravelTime(dist, mode);

  return {
    mode,
    durationMinutes: duration,
    distanceKm: Number(dist.toFixed(2)),
    from: { lat: fromLat, lng: fromLng },
    to: { lat: toLat, lng: toLng },
  };
}

// ============================================================================
// GEO-EXPLORATION UTILITIES
// ============================================================================

export interface SearchZone {
  id: string;
  lat: number;
  lng: number;
}

/**
 * Converts km offset to latitude delta.
 * 1 degree of latitude ≈ 111km everywhere on Earth.
 */
export function kmToLatOffset(km: number): number {
  return km / 111;
}

/**
 * Converts km offset to longitude delta.
 * Longitude distance varies by latitude (cos factor).
 */
export function kmToLngOffset(km: number, atLatitude: number): number {
  return km / (111 * Math.cos(atLatitude * (Math.PI / 180)));
}

/**
 * Generates search zones around a city center for geo-exploration.
 * Creates 9 zones: center + 8 cardinal/intercardinal directions.
 *
 * @param centerLat - City center latitude
 * @param centerLng - City center longitude
 * @param offsetKm - Distance from center to zone centers (default 6km)
 * @returns Array of search zones, starting with center
 */
export function generateSearchZones(centerLat: number, centerLng: number, offsetKm: number = 6): SearchZone[] {
  const zones: SearchZone[] = [{ id: "center", lat: centerLat, lng: centerLng }];

  // 8 cardinal + intercardinal directions
  const directions = [
    { id: "north", latMult: 1, lngMult: 0 },
    { id: "northeast", latMult: 0.7, lngMult: 0.7 },
    { id: "east", latMult: 0, lngMult: 1 },
    { id: "southeast", latMult: -0.7, lngMult: 0.7 },
    { id: "south", latMult: -1, lngMult: 0 },
    { id: "southwest", latMult: -0.7, lngMult: -0.7 },
    { id: "west", latMult: 0, lngMult: -1 },
    { id: "northwest", latMult: 0.7, lngMult: -0.7 },
  ];

  for (const dir of directions) {
    zones.push({
      id: dir.id,
      lat: centerLat + kmToLatOffset(offsetKm * dir.latMult),
      lng: centerLng + kmToLngOffset(offsetKm * dir.lngMult, centerLat),
    });
  }

  return zones;
}
