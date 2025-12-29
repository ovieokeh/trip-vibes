import { EngineCandidate } from "../types";

/**
 * Category patterns that indicate "thin" POIs with low experiential value.
 * These are places that exist as objects rather than destinations.
 */
const THIN_POI_PATTERNS = [
  "structure",
  "field",
  "building",
  "platform",
  "bridge",
  "intersection",
  "government building",
  "office",
  "parking",
  "gas station",
  "atm",
];

/**
 * Determines if a candidate is a "thin" POI with low experiential value.
 * Thin POIs are places that typically don't offer much to do or see.
 */
export function isThinPOI(candidate: EngineCandidate): boolean {
  const cats = (candidate.metadata?.categories || []).map((c) => c.toLowerCase());

  // Check category patterns
  if (cats.some((cat) => THIN_POI_PATTERNS.some((p) => cat.includes(p)))) {
    return true;
  }

  // Low photos + no rating = thin
  const photoCount = candidate.photos?.length || 0;
  const hasRating = candidate.rating && candidate.rating > 0;
  if (photoCount === 0 && !hasRating) {
    return true;
  }

  return false;
}

/**
 * Counts high-quality (non-thin) POIs in the candidate pool.
 * Used to determine if fallback relaxation is needed for sparse cities.
 */
export function countHighQualityPOIs(candidates: EngineCandidate[]): number {
  return candidates.filter((c) => !isThinPOI(c)).length;
}
