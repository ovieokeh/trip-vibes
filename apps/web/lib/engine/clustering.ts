import { generateSearchZones, calculateHaversineDistance } from "../geo";
import { EngineCandidate } from "../types";

export interface ClusteredCandidate {
  candidate: EngineCandidate;
  zoneId: string;
  distanceToZoneCenter: number;
}

/**
 * Assigns each candidate to a neighborhood zone.
 * Uses the existing geo-exploration zones (center + 8 cardinal directions).
 */
export function assignZones(
  candidates: EngineCandidate[],
  cityCenter: { lat: number; lng: number }
): ClusteredCandidate[] {
  const zones = generateSearchZones(cityCenter.lat, cityCenter.lng, 4); // 4km radius zones for tighter clustering

  return candidates.map((c) => {
    if (!c.lat || !c.lng) {
      return { candidate: c, zoneId: "unknown", distanceToZoneCenter: Infinity };
    }

    // Find closest zone
    let closestZone = zones[0];
    let minDist = Infinity;

    for (const zone of zones) {
      const dist = calculateHaversineDistance(c.lat, c.lng, zone.lat, zone.lng);
      if (dist < minDist) {
        minDist = dist;
        closestZone = zone;
      }
    }

    return { candidate: c, zoneId: closestZone.id, distanceToZoneCenter: minDist };
  });
}

/**
 * Penalizes zone changes within a day.
 * 0: same zone
 * -10: adjacent zone
 * -40: far jump
 */
export function getZoneChangePenalty(fromZone: string, toZone: string): number {
  if (fromZone === toZone || fromZone === "unknown" || toZone === "unknown") return 0;
  if (areAdjacentZones(fromZone, toZone)) return 10;
  return 40; // Penalty (will be subtracted)
}

function areAdjacentZones(a: string, b: string): boolean {
  const adjacencyMap: Record<string, string[]> = {
    center: ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"],
    north: ["center", "northeast", "northwest"],
    northeast: ["center", "north", "east"],
    east: ["center", "northeast", "southeast"],
    southeast: ["center", "east", "south"],
    south: ["center", "southeast", "southwest"],
    southwest: ["center", "south", "west"],
    west: ["center", "southwest", "northwest"],
    northwest: ["center", "west", "north"],
  };
  return adjacencyMap[a]?.includes(b) || false;
}
