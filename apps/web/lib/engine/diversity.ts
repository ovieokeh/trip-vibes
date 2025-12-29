/**
 * Calculates diversity penalty based on how many times a category has been used.
 * Uses exponential decay: first repeat = small penalty, subsequent = larger.
 *
 * Formula: penalty = baseMultiplier * (count ^ exponent)
 * - count=0: 0 penalty (first of its kind)
 * - count=1: -15 (second of same category)
 * - count=2: -45 (third - getting repetitive)
 * - count=3: -90 (fourth - strongly discouraged)
 */
export function calculateDiversityPenalty(
  categoryCount: number,
  baseMultiplier: number = 50,
  exponent: number = 1.5
): number {
  if (categoryCount === 0) return 0;
  return Math.round(baseMultiplier * Math.pow(categoryCount, exponent));
}

/**
 * Normalizes category names to group similar venues.
 * Uses Foursquare category hierarchy keywords.
 */
export function normalizeCategoryForDiversity(categories: string[]): string {
  if (!categories || categories.length === 0) return "unknown";

  const primary = categories[0].toLowerCase();

  // Group similar categories
  const groupings: [RegExp, string][] = [
    [/cinema|movie|imax|film/i, "cinema"],
    [/museum|gallery|art center|exhibition/i, "museum"],
    [/theater|theatre|opera|concert hall/i, "performing_arts"],
    [/park|garden|plaza|square/i, "outdoor_space"],
    [/restaurant|bistro|eatery|dining/i, "restaurant"],
    [/cafe|coffee|bakery/i, "cafe"],
    [/bar|pub|brewery|lounge/i, "bar"],
  ];

  for (const [pattern, group] of groupings) {
    if (pattern.test(primary)) return group;
  }

  return primary; // Use original if no grouping matches
}

/**
 * Tracks category usage and provides scoring for diversity.
 */
export class DiversityTracker {
  private categoryCounts = new Map<string, number>();

  /**
   * Records that a category was used.
   */
  record(categories: string[]): void {
    const normalized = normalizeCategoryForDiversity(categories);
    this.categoryCounts.set(normalized, (this.categoryCounts.get(normalized) || 0) + 1);
  }

  /**
   * Gets the penalty for adding another venue of this category.
   */
  getPenalty(categories: string[]): number {
    const normalized = normalizeCategoryForDiversity(categories);
    const count = this.categoryCounts.get(normalized) || 0;
    return calculateDiversityPenalty(count);
  }

  /**
   * Gets current count for a category.
   */
  getCount(categories: string[]): number {
    const normalized = normalizeCategoryForDiversity(categories);
    return this.categoryCounts.get(normalized) || 0;
  }
}
