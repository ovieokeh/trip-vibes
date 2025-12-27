import { EngineCandidate } from "../types";

/**
 * Patterns for classifying places as meals or activities.
 *
 * Classification Logic:
 * 1. A place is a MEAL if it matches FOOD_PATTERN (but NOT NIGHTLIFE_PATTERN)
 * 2. A place is an ACTIVITY if it does NOT match FOOD_PATTERN, OR if it's nightlife
 * 3. EXCEPTION: Hybrid places (markets, food halls) can be BOTH
 *
 * This ensures mutually exclusive classification except for explicit hybrids.
 */

// Food establishments - primarily for meal slots
const FOOD_PATTERN =
  /restaurant|cafe|food|bakery|bistro|diner|steakhouse|pizza|taco|burger|sushi|ramen|gastropub|eatery|grill/i;

// Nightlife - these should be activities (evening slots), not meals
const NIGHTLIFE_PATTERN = /pub|bar|nightclub|lounge|speakeasy|brewery|cocktail/i;

/**
 * Hybrid places can be scheduled as BOTH a meal AND an activity.
 * Examples: Chelsea Market, Time Out Market, food halls
 */
const HYBRID_PATTERN = /market|hall|food court/i;

/**
 * Checks if the candidate looks like a food place based on categories and name.
 */
function matchesFoodPattern(c: EngineCandidate): boolean {
  const cats = (c.metadata?.categories || []).map((s: string) => s.toLowerCase());
  const name = c.name.toLowerCase();
  const combined = [...cats, name].join(" ");
  return FOOD_PATTERN.test(combined);
}

/**
 * Checks if the candidate is a nightlife place.
 */
function matchesNightlifePattern(c: EngineCandidate): boolean {
  const cats = (c.metadata?.categories || []).map((s: string) => s.toLowerCase());
  const name = c.name.toLowerCase();
  const combined = [...cats, name].join(" ");
  return NIGHTLIFE_PATTERN.test(combined);
}

/**
 * Checks if the candidate is a hybrid place (can be both meal and activity).
 */
export function isHybridPlace(c: EngineCandidate): boolean {
  const cats = (c.metadata?.categories || []).map((s: string) => s.toLowerCase());
  const name = c.name.toLowerCase();
  const combined = [...cats, name].join(" ");
  return HYBRID_PATTERN.test(combined);
}

/**
 * Determines if a candidate should be scheduled in a MEAL slot.
 * Returns true if the place is primarily a food establishment.
 */
export function isMeal(c: EngineCandidate): boolean {
  // A meal is food that is NOT a nightlife venue
  // (pubs/bars should be activities, not meals)
  return matchesFoodPattern(c) && !matchesNightlifePattern(c);
}

/**
 * Determines if a candidate should be scheduled in an ACTIVITY slot.
 *
 * A place is an activity if:
 * 1. It does NOT look like food, OR
 * 2. It IS food but is also a hybrid place (market, food hall)
 *
 * This ensures meals and activities are mutually exclusive,
 * except for hybrid places which can appear in either slot.
 */
export function isActivity(c: EngineCandidate): boolean {
  // Nightlife is always an activity (evening vibes)
  if (matchesNightlifePattern(c)) return true;

  const looksLikeFood = matchesFoodPattern(c);

  // Not food = definitely an activity
  if (!looksLikeFood) return true;

  // Food but hybrid = can also be an activity
  return isHybridPlace(c);
}
