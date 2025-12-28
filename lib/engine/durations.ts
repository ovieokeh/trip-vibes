import { EngineCandidate } from "../types";
import { CATEGORIES } from "../categories";

/**
 * Pattern-based duration mapping for activity scheduling.
 * Matches against category names to determine estimated visit duration.
 *
 * Order matters - first match wins.
 */
const PATTERN_DURATIONS: [RegExp, number][] = [
  // Long visits (2-4 hours)
  [/zoo|aquarium|safari|theme.?park|amusement|water.?park/i, 180],
  [/museum|gallery|exhibit|stadium|arena/i, 120],
  [/beach|national.?park|nature.?reserve|botanical.?garden/i, 120],

  // Medium-long visits (1.5 hours)
  [/castle|palace|fortress|citadel|spa|hot.?spring|onsen|casino/i, 90],

  // Medium visits (1 hour)
  [/park|plaza|square|promenade|market|bazaar|flea.?market/i, 60],
  [/temple|church|cathedral|mosque|shrine|monastery|synagogue/i, 60],
  [/arcade|bowling|escape.?room|mini.?golf|laser.?tag/i, 75],
  [/nightclub|comedy.?club|concert|theater|opera/i, 120],

  // Short visits (30 min)
  [/viewpoint|lookout|observation|scenic/i, 30],
  [/bridge|tower|monument|statue|memorial|fountain/i, 30],
  [/library|bookstore/i, 30],
  [/street.?art|mural|sculpture|public.?art/i, 30],
];

/**
 * Top-level category fallback durations.
 * Used when pattern matching doesn't find a match.
 */
const TOP_LEVEL_DEFAULTS: Record<string, number> = {
  "4d4b7104d754a06370d81259": 60, // Arts and Entertainment
  "4d4b7105d754a06377d81259": 45, // Landmarks and Outdoors
  "4d4b7105d754a0637bd81259": 30, // Community and Government
  "4d4b7105d754a06373d81259": 120, // Event
  "4d4b7105d754a06372d81259": 60, // College and University
};

const DEFAULT_DURATION = 60; // Ultimate fallback

/**
 * Get the top-level category ID for a given category ID.
 * Traverses up the parent chain until reaching a root category.
 */
function getTopLevelCategoryId(categoryId: string): string | null {
  let currentId = categoryId;
  let node = CATEGORIES[currentId];
  let depth = 0;

  while (node && node.parentId && depth < 10) {
    currentId = node.parentId;
    node = CATEGORIES[currentId];
    depth++;
  }

  return node ? currentId : null;
}

/**
 * Determines the estimated visit duration for a candidate based on its categories.
 *
 * Uses a 3-tier approach:
 * 1. Pattern matching on category names (most specific)
 * 2. Top-level category defaults
 * 3. Ultimate fallback (60 min)
 *
 * @param candidate - The engine candidate to get duration for
 * @returns Duration in minutes
 */
export function getDurationForCandidate(candidate: EngineCandidate): number {
  const categories = candidate.metadata?.categories || [];
  const name = candidate.name || "";
  const combined = [...categories, name].join(" ").toLowerCase();

  // Tier 1: Pattern matching
  for (const [pattern, duration] of PATTERN_DURATIONS) {
    if (pattern.test(combined)) {
      return duration;
    }
  }

  // Tier 2: Top-level category fallback
  // Try to find a matching top-level category from metadata.categoryIds
  const categoryIds = (candidate.metadata as any)?.categoryIds || [];
  for (const catId of categoryIds) {
    const topLevelId = getTopLevelCategoryId(catId);
    if (topLevelId && TOP_LEVEL_DEFAULTS[topLevelId]) {
      return TOP_LEVEL_DEFAULTS[topLevelId];
    }
  }

  // Tier 3: Ultimate fallback
  return DEFAULT_DURATION;
}

/**
 * Get time window boundaries based on user's vibe profile.
 *
 * Uses the "nightlife" weight to determine if user is:
 * - Early riser (nightlife < -5): Starts earlier, ends earlier
 * - Night crawler (nightlife > 5): Starts later, ends later
 * - Default: Balanced schedule
 */
export function getTimeWindows(nightlifeWeight: number = 0): {
  preMorning: { start: string; end: string };
  postDinner: { start: string; end: string };
} {
  if (nightlifeWeight < -5) {
    // Early riser - wake up early, sleep early
    return {
      preMorning: { start: "07:00", end: "09:00" },
      postDinner: { start: "21:00", end: "22:30" },
    };
  } else if (nightlifeWeight > 5) {
    // Night crawler - sleep in, stay out late
    return {
      preMorning: { start: "08:00", end: "09:00" },
      postDinner: { start: "21:00", end: "00:00" },
    };
  } else {
    // Default balanced schedule
    return {
      preMorning: { start: "07:30", end: "09:00" },
      postDinner: { start: "21:00", end: "23:00" },
    };
  }
}
