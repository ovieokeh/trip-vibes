import { EngineCandidate } from "../types";

const FOOD_PATTERN =
  /restaurant|cafe|food|bakery|bistro|diner|steakhouse|pizza|taco|burger|sushi|ramen|gastropub|pub|bar|eatery|grill/;

const EXCLUDE_FROM_FOOD_PATTERN = /market|hall|museum|park|plaza/;

export function isMeal(c: EngineCandidate): boolean {
  const cats = (c.metadata.categories || []).map((s: string) => s.toLowerCase());
  const name = c.name.toLowerCase();
  const combined = [...cats, name].join(" ");
  return FOOD_PATTERN.test(combined);
}

export function isActivity(c: EngineCandidate): boolean {
  const cats = (c.metadata.categories || []).map((s: string) => s.toLowerCase());
  const name = c.name.toLowerCase();
  const combined = [...cats, name].join(" ");
  const looksLikeFood = FOOD_PATTERN.test(combined);

  // It's an activity if it's NOT food, OR if it IS food but also matches "market/museum/etc"
  // (e.g. "Chelsea Market" is food but can be an activity)
  if (!looksLikeFood) return true;

  return EXCLUDE_FROM_FOOD_PATTERN.test(combined);
}
