import { UserPreferences, Itinerary } from "../types";
import { db } from "../db";
import { cities } from "../db/schema";
import { eq } from "drizzle-orm";
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

    // Resolve City
    let city = (await db.select().from(cities).where(eq(cities.id, this.prefs.cityId)).limit(1))[0];
    if (!city) {
      city = (await db.select().from(cities).where(eq(cities.slug, this.prefs.cityId)).limit(1))[0];
      if (!city) throw new Error(`Location ${this.prefs.cityId} not found in database.`);
      this.prefs.cityId = city.id;
    }

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
    let candidates = await discovery.findCandidates(city, { minMeals, minActivities });

    // 2. Scoring & Ranking
    this.onProgress("Synthesizing vibe profile...");
    const scoring = new ScoringEngine(this.prefs);
    candidates = scoring.rankCandidates(candidates);

    // 3. Deep Enrichment (Google) - Optional / Lazy
    // We enrich a balanced set of top candidates to ensure high quality itinerary items
    const mealCandidates = candidates.filter(isMeal);
    const activityCandidates = candidates.filter(isActivity);

    // Dynamic sizing for Top Picks
    const topActivities = activityCandidates.slice(0, minActivities);
    const topMeals = mealCandidates.slice(0, minMeals);
    const topCandidates = [...topActivities, ...topMeals];

    this.onProgress(" enriching top picks...");
    await Promise.all(topCandidates.map((c) => discovery.enrichFromGoogle(c)));

    // 4. Scheduling
    this.onProgress("Assembling your journey...");
    const scheduler = new SchedulerEngine(this.prefs);
    const itinerary = scheduler.assembleItinerary(topCandidates); // Use enriched balanced pool

    this.onProgress("Finalizing details...");
    return itinerary;
  }
}
