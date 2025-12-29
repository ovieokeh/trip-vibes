import { EngineCandidate, UserPreferences } from "../types";

export class ScoringEngine {
  private prefs: UserPreferences;

  constructor(prefs: UserPreferences) {
    this.prefs = prefs;
  }

  public rankCandidates(candidates: EngineCandidate[]): EngineCandidate[] {
    const weights = this.prefs.vibeProfile?.weights || {};

    return candidates
      .map((p) => {
        let score = this.calculateScore(p, weights);

        // Apply logistics penalties/boosts
        score -= this.calculateRedundancyPenalty(p, candidates);
        score -= this.calculateGenericPenalty(p);
        score += this.calculateIconicBoost(p);

        return { ...p, _score: score };
      })
      .sort((a: any, b: any) => b._score - a._score);
  }

  private calculateScore(place: EngineCandidate, weights: Record<string, number>): number {
    let score = 0;
    const placeCategories = place.metadata?.categories || [];
    // Also check categoryIds if available (newly saved places)
    const placeCategoryIds = (place.metadata as any)?.categoryIds || [];

    // Base Score from Rating
    score += (place.rating || 0) * 5; // 0-10 scale -> 0-50 points

    // Bonus for Photos
    if (place.imageUrl || (place.photos && place.photos.length > 0)) {
      score += 20;
    }

    // Trait Matching
    // We match User Traits (e.g. "Nature" weight: 10) against Place Categories
    for (const [trait, weight] of Object.entries(weights)) {
      if (weight <= 0) continue;

      // How to match "Nature" trait to "National Park" category?
      // We need a mapping from Trait -> Category Keywords or IDs
      // "Nature" -> ["Park", "Garden", "Beach"]

      // This is similar to Discovery, but strictly for scoring.
      if (this.isMatch(placeCategories, trait)) {
        score += weight * 3;
      }
    }

    return score;
  }

  private isMatch(placeCategories: string[], trait: string): boolean {
    const synonyms: Record<string, string[]> = {
      nature: ["park", "garden", "beach", "forest", "hiking", "outdoors", "zoo"],
      urban: ["plaza", "architecture", "downtown", "landmark", "street", "market"],
      food: ["restaurant", "bistro", "eatery", "gastronomy", "dining", "bakery", "cafe"],
      nightlife: ["cocktail", "nightclub", "lounge", "speakeasy", "brewery", "bar", "pub"],
      luxury: ["exclusive", "upscale", "fine dining", "boutique", "steakhouse"],
      culture: ["museum", "gallery", "art", "theater", "history", "temple", "church"],
      history: ["historic", "castle", "monument", "ruins"],
      adventure: ["climbing", "escape", "sport", "hiking", "surf"],
      relaxing: ["spa", "yoga", "bookstore", "cafe", "park"],
      social: ["park", "market", "plaza", "bowling"],
    };

    const keywords = synonyms[trait.toLowerCase()] || [trait];

    return placeCategories.some((cat) => {
      const lowerCat = cat.toLowerCase();
      return keywords.some((k) => lowerCat.includes(k));
    });
  }

  /**
   * Penalizes "generic anywhere" venues like chain cinemas or fast food.
   */
  /**
   * Penalizes "generic anywhere" venues like chain cinemas or fast food.
   */
  private calculateGenericPenalty(p: EngineCandidate): number {
    // 1. Auto-detected chains (from DiscoveryEngine)
    if (p.metadata?.isChain) {
      return 30;
    }

    // 2. Hardcoded global blacklist (fallbacks)
    const name = (p.name || "").toLowerCase();
    const genericPatterns = [
      "imax",
      "cinema city",
      "multikino",
      "starbucks",
      "mcdonald",
      "burger king",
      "kfc",
      "o'learys",
      "espresso house",
      "vapiano",
      "subway",
      "hard rock cafe",
    ];
    if (genericPatterns.some((pattern) => name.includes(pattern))) {
      return 30;
    }
    return 0;
  }

  /**
   * Boosts iconic/city-specific venues using category keywords.
   */
  private calculateIconicBoost(p: EngineCandidate): number {
    const cats = (p.metadata?.categories || []).join(" ").toLowerCase();
    const iconicPatterns = ["historic", "castle", "palace", "cathedral", "landmark", "scenic"];
    if (iconicPatterns.some((pattern) => cats.includes(pattern))) {
      return 20;
    }
    return 0;
  }

  /**
   * Light redundancy penalty based on pool saturation.
   */
  private calculateRedundancyPenalty(p: EngineCandidate, all: EngineCandidate[]): number {
    const primaryCat = p.metadata?.categories?.[0]?.toLowerCase();
    if (!primaryCat) return 0;

    const sameCategory = all.filter((c) => c.metadata?.categories?.[0]?.toLowerCase() === primaryCat).length;

    // If more than 20% of the pool is the same category, slightly penalize individual items
    // to encourage variety in the top results.
    if (sameCategory > all.length * 0.2 && sameCategory > 5) {
      return 10;
    }
    return 0;
  }
}
