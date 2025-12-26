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

export function getTransitNote(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  const dist = calculateHaversineDistance(fromLat, fromLng, toLat, toLng);

  if (dist < 1.5) {
    const mins = estimateTravelTime(dist, "walking");
    return `${mins} min walk`;
  } else {
    const mins = estimateTravelTime(dist, "driving");
    return `${mins} min drive`;
  }
}

export function getTravelDetails(fromLat: number, fromLng: number, toLat: number, toLng: number): TransitDetails {
  const dist = calculateHaversineDistance(fromLat, fromLng, toLat, toLng);

  // Default mode logic
  let mode: "walking" | "driving" = "walking";
  if (dist >= 2.0) mode = "driving";

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
