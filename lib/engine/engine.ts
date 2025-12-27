import { UserPreferences, Itinerary } from "../types";
import { db } from "../db";
import { cities } from "../db/schema";
import { eq } from "drizzle-orm";
import { DiscoveryEngine } from "./discovery";
import { ScoringEngine } from "./scoring";
import { SchedulerEngine } from "./scheduler";

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
    this.onProgress(`Scouting vibes in ${city.name} (DB + Foursquare)...`);
    const discovery = new DiscoveryEngine(this.prefs);
    let candidates = await discovery.findCandidates(city);

    // 2. Scoring & Ranking
    this.onProgress("Synthesizing vibe profile...");
    const scoring = new ScoringEngine(this.prefs);
    candidates = scoring.rankCandidates(candidates);

    // 3. Deep Enrichment (Google) - Optional / Lazy
    // We enrich the top N to ensure high quality itinerary items
    // This was in the original engine. Let's keep a limited version.
    const topCandidates = candidates.slice(0, 25);
    this.onProgress(" enriching top picks with Google details...");
    await Promise.all(topCandidates.map((c) => discovery.enrichFromGoogle(c)));

    // 4. Scheduling
    this.onProgress("Assembling your journey...");
    const scheduler = new SchedulerEngine(this.prefs);
    const itinerary = scheduler.assembleItinerary(topCandidates); // Use enriched ones

    this.onProgress("Finalizing details...");
    return itinerary;
  }
}
