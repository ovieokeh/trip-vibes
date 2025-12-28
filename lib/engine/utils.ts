import { EngineCandidate } from "../types";

/**
 * Patterns for classifying places as meals or activities.
 *
 * Based on REAL Foursquare category analysis:
 * - Categories are structured: "Thai Restaurant", "Beer Bar", "Monument"
 * - Most food places end with "Restaurant", "Joint", "Spot", etc.
 * - Bars serve food/drinks but are evening entertainment
 *
 * Classification Logic:
 * 1. TRUE ACTIVITIES: Parks, museums, monuments, etc. - never food
 * 2. MEALS: Restaurants, cafes, bakeries - for meal slots only
 * 3. BARS/NIGHTLIFE: Evening entertainment, counts toward food limit
 * 4. HYBRID: Markets, food halls - can be both
 */

// TRUE activity categories - these are NEVER food
// Based on real Foursquare categories: "Park", "Museum", "Monument", etc.
const ACTIVITY_PATTERN =
  /park|plaza|beach|monument|museum|gallery|castle|church|shrine|temple|zoo|botanical garden|theater|theatre|stadium|trail|hiking|forest|lake|island|arcade|amusement|playground|swimming|sauna|spa|scenic|historic|structure|field|court|rink|sports|recreation|street art|harbor|marina/i;

// Food establishments - for meal slots
// Based on real categories: "Thai Restaurant", "Bakery", "Fast Food Restaurant"
const FOOD_PATTERN =
  /restaurant|café|cafe|bakery|bistro|diner|steakhouse|pizzeria|buffet|gastropub|food truck|breakfast spot|snack|sandwich spot|joint|eatery|grill|ice cream|dessert|pastry|donut|bagel|cupcake|pie shop|soup spot|deli\b|noodle|ramen|sushi|taco|burrito|falafel|dumpling/i;

// Nightlife - evening entertainment that ALSO serves food/drinks
// Use word boundary for "bar" to avoid matching "Barbershop"
// Based on real categories: "Beer Bar", "Wine Bar", "Pub", "Night Club"
const NIGHTLIFE_PATTERN =
  /\bbar\b|beer bar|wine bar|cocktail bar|sake bar|karaoke bar|piano bar|pub|beer garden|lounge|night club|nightclub|speakeasy|rock club|jazz|music venue|brewery/i;

/**
 * Hybrid places can be scheduled as BOTH a meal AND an activity.
 * Examples: Chelsea Market, Time Out Market, food halls
 */
const HYBRID_PATTERN = /market|hall|food court/i;

/**
 * Gets combined text from candidate's categories and name for pattern matching.
 */
function getCombinedText(c: EngineCandidate): string {
  const cats = (c.metadata?.categories || []).map((s: string) => s.toLowerCase());
  const name = (c.name || "").toLowerCase();
  return [...cats, name].join(" ");
}

/**
 * Checks if the candidate is a TRUE activity (park, museum, etc.)
 */
function matchesActivityPattern(c: EngineCandidate): boolean {
  return ACTIVITY_PATTERN.test(getCombinedText(c));
}

/**
 * Checks if the candidate looks like a food place based on categories and name.
 */
function matchesFoodPattern(c: EngineCandidate): boolean {
  return FOOD_PATTERN.test(getCombinedText(c));
}

/**
 * Checks if a category name represents food.
 * Helper for DiscoveryEngine to filter API requests.
 */
export function isFoodCategoryName(name: string): boolean {
  return FOOD_PATTERN.test(name.toLowerCase());
}

/**
 * Checks if the candidate is a nightlife place.
 */
export function matchesNightlifePattern(c: EngineCandidate): boolean {
  return NIGHTLIFE_PATTERN.test(getCombinedText(c));
}

/**
 * Checks if the candidate is a hybrid place (can be both meal and activity).
 */
export function isHybridPlace(c: EngineCandidate): boolean {
  return HYBRID_PATTERN.test(getCombinedText(c));
}

/**
 * Determines if a candidate should be scheduled in a MEAL slot.
 * Returns true for food establishments AND bars/nightlife (they serve food/drinks).
 */
export function isMeal(c: EngineCandidate): boolean {
  // Food establishments are meals
  // Prioritize this check so "Garden Restaurant" is matched as a meal
  if (matchesFoodPattern(c)) return true;

  // Nightlife serves food/drinks - count toward meal/food limit
  if (matchesNightlifePattern(c)) return true;

  // Hybrids (Markets) can be meals
  if (isHybridPlace(c)) return true;

  return false;
}

/**
 * Determines if a candidate should be scheduled in an ACTIVITY slot.
 *
 * A place is an activity if:
 * 1. It matches the explicit ACTIVITY_PATTERN (park, museum, etc.)
 * 2. It's a hybrid place (market, food hall)
 * 3. It doesn't match any food OR nightlife patterns
 *
 * IMPORTANT: Bars/nightlife are NOT activities - they serve food and
 * should count toward food limits, scheduled only in evening slots.
 */
export function isActivity(c: EngineCandidate): boolean {
  // 1. Hybrids are allowed (Markets, Food Halls) - can be activity OR meal
  if (isHybridPlace(c)) return true;

  // 2. Food/Nightlife are strictly NOT activities (unless hybrid)
  // This prevents "Garden Restaurant" from being an activity
  if (matchesFoodPattern(c) || matchesNightlifePattern(c)) return false;

  // 3. Explicit Match
  if (matchesActivityPattern(c)) return true;

  // 4. Fallback
  return true;
}
