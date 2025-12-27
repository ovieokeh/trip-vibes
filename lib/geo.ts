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

export function estimateTravelTime(distanceKm: number, mode: "walking" | "driving" | "transit"): number {
  // Average speeds
  const walkingSpeedKmH = 5.0;
  const drivingSpeedKmH = 30.0; // Inner city average
  const transitSpeedKmH = 15.0; // Bus/Tram with stops

  let speed = walkingSpeedKmH;
  if (mode === "driving") speed = drivingSpeedKmH;
  if (mode === "transit") speed = transitSpeedKmH;

  const timeHours = distanceKm / speed;
  return Math.ceil(timeHours * 60); // Return minutes
}

/**
 * Walking vs driving threshold in kilometers.
 * Used by both getTransitNote and getTravelDetails for consistency.
 */
const WALKING_THRESHOLD_KM = 2.0;

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
