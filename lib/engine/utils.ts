import { EngineCandidate } from "../types";
import { CATEGORIES, CategoryNode } from "../categories";

/**
 * Root Category IDs from Foursquare hierarchy.
 */
const ROOT_IDS = {
  DINING: "63be6904847c3692a84b9bb5", // Dining and Drinking
  ARTS: "4d4b7104d754a06370d81259", // Arts and Entertainment
  LANDMARKS: "4d4b7105d754a06377d81259", // Landmarks and Outdoors
  SPORTS: "4d4b7105d754a06372d81259", // Sports and Recreation
  EVENTS: "4d4b7105d754a06373d81259", // Event
  NIGHTLIFE: "4d4b7105d754a06376d81259", // Nightlife Spot (Legacy/Separate root often)
  // Note: recent FSQ taxonomy often puts Nightlife under "Dining and Drinking" or separate.
  // In our categories.ts, "Bar" is under "Dining and Drinking".
};

/**
 * Special IDs to strictly EXCLUDE from meals even if they are under Dining.
 * (e.g. if we consider "Arcade" a meal because it sells pizza, we exclude it here if it's primarily an arcade)
 *
 * Actually, strict exclusion is mostly for things like "VR Cafe" which are under Arts, so
 * the root check handles them efficiently.
 *
 * However, we might want to exclude "Winery" from breakfast if we wanted strict enforcement,
 * but let's stick to the root check first.
 */

function getCandidateCategoryId(c: EngineCandidate): string | null {
  // Check for categoryIds array (how discovery.ts saves them)
  const categoryIds = (c.metadata as any)?.categoryIds;
  if (Array.isArray(categoryIds) && categoryIds.length > 0) {
    return categoryIds[0];
  }

  // Legacy fallback: singular categoryId
  if (c.metadata?.categoryId) return c.metadata.categoryId;

  return null;
}

/**
 * Checks if a candidate's category is a descendant of a specific root ID.
 */
export function isCategoryDescendant(candidateId: string, rootId: string): boolean {
  if (candidateId === rootId) return true;

  let currentId: string | null = candidateId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === rootId) return true;
    if (visited.has(currentId)) break; // Cycle protection
    visited.add(currentId);

    const node: CategoryNode | undefined = CATEGORIES[currentId];
    if (!node) break;
    currentId = node.parentId;
  }
  return false;
}

/**
 * Determines if a candidate should be scheduled in a MEAL slot.
 * Returns true for food establishments AND bars/nightlife (they serve food/drinks).
 */
export function isMeal(c: EngineCandidate): boolean {
  const catId = getCandidateCategoryId(c);

  // 1. ID-Based Check (Robust)
  if (catId) {
    // "Dining and Drinking" covers Restaurants, Cafes, Bars, Bakeries.
    if (isCategoryDescendant(catId, ROOT_IDS.DINING)) {
      return true;
    }
    // If it's NOT under Dining, it's NOT a meal.
    // This implicitly excludes "VR Cafe" (Arts), "Bridge" (Landmarks).
    return false;
  }

  // 2. Legacy Fallback (String Matching) - Only if no ID
  // (We should maintain this until we confirm all candidates have IDs)
  return legacyIsMeal(c);
}

/**
 * Determines if a candidate should be scheduled in an ACTIVITY slot.
 */
export function isActivity(c: EngineCandidate): boolean {
  const catId = getCandidateCategoryId(c);

  // 1. ID-Based Check (Robust)
  if (catId) {
    if (
      isCategoryDescendant(catId, ROOT_IDS.ARTS) ||
      isCategoryDescendant(catId, ROOT_IDS.LANDMARKS) ||
      isCategoryDescendant(catId, ROOT_IDS.SPORTS) ||
      isCategoryDescendant(catId, ROOT_IDS.EVENTS)
    ) {
      return true;
    }
    // "Sights and Landmarks" might be separate root in older taxonomy,
    // but usually Landmarks covers it.

    // Explicitly allow "Markets" (which might be under Retail or Dining) if we consider them activities?
    // For now, let's trust the 4 big roots.
    return false;
  }

  // 2. Legacy Fallback
  return legacyIsActivity(c);
}

// --- LEGACY LOGIC (Keep for fallback) ---

const ACTIVITY_PATTERN =
  /park|plaza|beach|monument|museum|gallery|castle|church|shrine|temple|zoo|botanical garden|theater|theatre|stadium|trail|hiking|forest|lake|island|arcade|amusement|playground|swimming|sauna|spa|scenic|historic|structure|field|court|rink|sports|recreation|street art|harbor|marina|bridge|canal|avenue|square|neighborhood/i;

const FOOD_PATTERN =
  /restaurant|café|cafe|bakery|bistro|diner|steakhouse|pizzeria|buffet|gastropub|food truck|breakfast spot|snack|sandwich spot|joint|eatery|grill|ice cream|dessert|pastry|donut|bagel|cupcake|pie shop|soup spot|deli\b|noodle|ramen|sushi|taco|burrito|falafel|dumpling/i;

const NIGHTLIFE_PATTERN =
  /\bbar\b|beer bar|wine bar|cocktail bar|sake bar|karaoke bar|piano bar|pub|beer garden|lounge|night club|nightclub|speakeasy|rock club|jazz|music venue|brewery/i;

const HYBRID_PATTERN = /market|hall|food court/i;

function getCombinedText(c: EngineCandidate): string {
  const cats = (c.metadata?.categories || []).map((s: string) => s.toLowerCase());
  const name = (c.name || "").toLowerCase();
  return [...cats, name].join(" ");
}

function legacyIsMeal(c: EngineCandidate): boolean {
  if (FOOD_PATTERN.test(getCombinedText(c))) return true;
  if (NIGHTLIFE_PATTERN.test(getCombinedText(c))) return true;
  if (HYBRID_PATTERN.test(getCombinedText(c))) return true;
  return false;
}

function legacyIsActivity(c: EngineCandidate): boolean {
  if (HYBRID_PATTERN.test(getCombinedText(c))) return true;
  if (legacyIsMeal(c)) return false; // Strict exclusion of food terms
  return true; // Default to activity if not food
}

export function isFoodCategoryName(name: string): boolean {
  return FOOD_PATTERN.test(name.toLowerCase());
}

/**
 * Checks if the candidate is a nightlife place.
 * Used by AnchorMealsStage to allow bars for dinner.
 */
export function matchesNightlifePattern(c: EngineCandidate): boolean {
  return NIGHTLIFE_PATTERN.test(getCombinedText(c));
}
