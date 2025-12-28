import { UserPreferences, Itinerary } from "../types";
import { db } from "../db";
import { cities } from "../db/schema";
import { eq, or } from "drizzle-orm";
import { DiscoveryEngine } from "./discovery";
import { ScoringEngine } from "./scoring";
import { SchedulerEngine } from "./scheduler";
import { isMeal, isActivity } from "./utils";

export class MatchingEngine {
  private prefs: UserPreferences;
  private onProgress: (msg: string) => void;

  constructor(prefs: UserPreferences, onProgress?: (msg: string) => void) {
    this.prefs = prefs;
    this.onProgress = onProgress || (() => {});
  }

  async generate(): Promise<Itinerary> {
    this.onProgress("Initializing engine...");

    // Resolve City - single query with OR for both id and slug lookup
    const cityResult = await db
      .select()
      .from(cities)
      .where(or(eq(cities.id, this.prefs.cityId), eq(cities.slug, this.prefs.cityId)))
      .limit(1);

    const city = cityResult[0];
    if (!city) throw new Error(`Location ${this.prefs.cityId} not found in database.`);
    this.prefs.cityId = city.id;

    // 1. Discovery
    // 1. Discovery
    const start = new Date(this.prefs.startDate);
    const end = new Date(this.prefs.endDate);
    const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);

    // Calculate dynamic needs
    // We target 4 meals per day (Breakfast, Lunch, Dinner + 1 buffer)
    // We target 4 activities per day (Morning, Afternoon, Evening + 1 buffer)
    const minMeals = dayCount * 4;
    const minActivities = dayCount * 4;

    this.onProgress(`Scouting vibes in ${city.name} for ${dayCount} days`);
    const discovery = new DiscoveryEngine(this.prefs);
    let candidates = await discovery.findCandidates(city, { minMeals, minActivities }, this.prefs.forceRefresh);

    // 2. Scoring & Ranking
    this.onProgress("Synthesizing vibe profile...");
    const scoring = new ScoringEngine(this.prefs);
    candidates = scoring.rankCandidates(candidates);

    // 3. Deep Enrichment (Google) - Optional / Lazy
    // We only enrich top candidates to save Google API quota
    // But we pass ALL candidates to the scheduler so it has maximum choice
    const mealCandidates = candidates.filter(isMeal);
    const activityCandidates = candidates.filter(isActivity);

    // Calculate how many to enrich (top picks for quality)
    // We need 2× slots to account for primary + alternative
    // Daily template has 6 slots, so 6 × dayCount × 2 = 12 × dayCount
    const enrichmentLimit = dayCount * 12;
    const topActivitiesToEnrich = activityCandidates.slice(0, enrichmentLimit);
    const topMealsToEnrich = mealCandidates.slice(0, enrichmentLimit);

    // Deduplicate enrichment targets (hybrids may appear in both)
    const enrichmentSet = new Map<string, (typeof candidates)[0]>();
    for (const c of [...topActivitiesToEnrich, ...topMealsToEnrich]) {
      if (!enrichmentSet.has(c.id)) {
        enrichmentSet.set(c.id, c);
      }
    }
    const toEnrich = Array.from(enrichmentSet.values());

    this.onProgress(`Enriching ${toEnrich.length} top picks...`);
    await Promise.all(toEnrich.map((c) => discovery.enrichFromGoogle(c)));

    // 4. Scheduling - pass ALL candidates, not just enriched ones
    // This ensures the scheduler has maximum flexibility
    this.onProgress("Assembling your journey...");
    const scheduler = new SchedulerEngine(this.prefs);

    // Deduplicate all candidates before passing to scheduler
    const allCandidatesMap = new Map<string, (typeof candidates)[0]>();
    for (const c of candidates) {
      if (!allCandidatesMap.has(c.id)) {
        allCandidatesMap.set(c.id, c);
      }
    }
    const allUniqueCandidates = Array.from(allCandidatesMap.values());

    console.log(
      `[Engine] Passing ${allUniqueCandidates.length} candidates to scheduler (${mealCandidates.length} meals, ${activityCandidates.length} activities)`
    );

    const itinerary = scheduler.assembleItinerary(allUniqueCandidates);

    this.onProgress("Finalizing details...");
    return itinerary;
  }
}
