import { ARCHETYPES, ArchetypeDefinition } from "./archetypes";
import { VibeProfile } from "./types";

export class DeckEngine {
  private usedIds: Set<string>;

  constructor(previousSwipeIds: string[] = []) {
    this.usedIds = new Set(previousSwipeIds);
  }

  /**
   * Generates the next card to show based on current profile.
   */
  public getNextCard(profile: VibeProfile, temporaryIgnoreIds: string[] = []): ArchetypeDefinition | null {
    // 1. Filter out used cards and temporary ignores
    const candidates = ARCHETYPES.filter((a) => !this.usedIds.has(a.id) && !temporaryIgnoreIds.includes(a.id));

    if (candidates.length === 0) return null;

    // 2. Initial State (Swipe 1 & 2): Pick broadly distinct "Anchors"
    // If profile is empty/neutral, we want to establish a baseline.
    if (Object.keys(profile.weights).length === 0) {
      // Return a random Core Vibe
      // Weights are usually defined for 'nature', 'urban', etc.
      // Let's bias towards the "Broad Appeal" ones first (first 5 in list usually)
      const core = candidates.filter((c) =>
        ["nature-lover", "urban-explorer", "foodie", "night-crawler", "art-buff"].includes(c.id)
      );
      if (core.length > 0) {
        return this.pickRandom(core);
      }
    }

    // 3. Scoring Logic
    // Score each candidate based on dot product of profile weights * card weights
    const scored = candidates.map((card) => {
      let score = 0;
      let diversityScore = 0; // How different is this?

      for (const [key, weight] of Object.entries(card.weights)) {
        const userWeight = profile.weights[key] || 0;
        score += userWeight * weight;
      }

      // Calculate diversity (simple heuristic: if score is close to 0, it's orthogonal)
      diversityScore = 10 - Math.abs(score);

      return { card, score, diversityScore };
    });

    // 4. Selection Strategy based on progress (Swipe 1-6)
    // Early swipes (1-3): Explore. High diversity is good.
    // Late swipes (4-6): Exploit. High affinity (score) is good.
    // We can infer stage from usedIds.size
    const step = this.usedIds.size + 1;

    let selected: ArchetypeDefinition;

    if (step === 3) {
      // The Wildcard: Pick something with high diversity / low correlation
      // Sort by diversity desc
      scored.sort((a, b) => b.diversityScore - a.diversityScore);
      // Pick top 3 diverse and random one
      const pool = scored.slice(0, 3).map((s) => s.card);
      selected = this.pickRandom(pool);
    } else if (step >= 4) {
      // Refinement: Pick highest affinity (most consistent with profile)
      scored.sort((a, b) => b.score - a.score);
      // Pick from top 3 to keep it not too deterministic
      const pool = scored.slice(0, 3).map((s) => s.card);
      selected = this.pickRandom(pool);
    } else {
      // Step 2: Reaction. Pick something related to current positive weights.
      // But also mix in some randomness.
      scored.sort((a, b) => b.score - a.score);
      const pool = scored.slice(0, 5).map((s) => s.card);
      selected = this.pickRandom(pool);
    }

    return selected;
  }

  private pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Updates the profile weights based on a swipe.
   */
  public static updateProfile(currentProfile: VibeProfile, archetypeId: string, liked: boolean): VibeProfile {
    const archetype = ARCHETYPES.find((a) => a.id === archetypeId);
    if (!archetype) return currentProfile;

    const newWeights = { ...currentProfile.weights };
    const direction = liked ? 1 : -1;

    // Update weights
    for (const [key, weight] of Object.entries(archetype.weights)) {
      // We add the card's weight * direction to the user's profile
      // e.g. liking Nature (nature: 10) adds 10 to user's nature score.
      // Disliking it subtracts 10.
      newWeights[key] = (newWeights[key] || 0) + weight * direction * 0.5; // 0.5 learning rate
    }

    // Also handle 'relatedVibes' and 'conflictingVibes' as meta-weights?
    // For now, let's stick to the raw attribute weights as they are more granular.

    return {
      weights: newWeights,
      swipes: currentProfile.swipes + 1,
    };
  }
}
