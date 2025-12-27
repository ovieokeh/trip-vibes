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
        const score = this.calculateScore(p, weights);
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

    // Check if any place category contains any keyword
    return placeCategories.some((cat) => {
      const lowerCat = cat.toLowerCase();
      return keywords.some((k) => lowerCat.includes(k));
    });
  }
}
