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

    // 1. Setup Time Budget
    const start = new Date(this.prefs.startDate);
    const end = new Date(this.prefs.endDate);
    const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);

    // START: Smart Retry Logic
    let minMeals = 20; // Generous meal pool
    let minActivities = 50; // Initial activity pool
    let retryCount = 0;
    const MAX_RETRIES = 1; // 1 Retry allowed (total 2 attempts) to save quota
    let itinerary: Itinerary | null = null;

    while (retryCount <= MAX_RETRIES) {
      if (retryCount > 0) {
        this.onProgress(`Expanding search (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
        minActivities += 50; // Fetch significantly more on retry
      }

      this.onProgress(`Scouting vibes in ${city.name} for ${dayCount} days`);
      const discovery = new DiscoveryEngine(this.prefs);

      // Fetch with forceRefresh on retry to ensure we get new Foursquare data
      const candidates = await discovery.findCandidates(
        city,
        { minMeals, minActivities },
        this.prefs.forceRefresh || retryCount > 0
      );

      // 2. Scoring
      this.onProgress(`Ranking ${candidates.length} options...`);
      const scoring = new ScoringEngine(this.prefs);
      const rankedCandidates = scoring.rankCandidates(candidates);

      // 3. Enrichment & Balancing
      // We need to ensure we have enough meal candidates for the scheduler, even if they aren't in the top N
      const requiredMealsPerDay = 2; // Breakfast + Dinner
      const requiredMeals = dayCount * requiredMealsPerDay * 2; // 2x buffer

      let topCandidates = rankedCandidates.slice(0, minMeals + minActivities + 30);
      const mealsInTop = topCandidates.filter(isMeal);

      if (mealsInTop.length < requiredMeals) {
        process.env.NODE_ENV !== "test" &&
          console.log(`[Engine] Supplementing meals. Top had ${mealsInTop.length}, need ${requiredMeals}`);
        const remainingMeals = rankedCandidates
          .slice(topCandidates.length)
          .filter(isMeal)
          .slice(0, requiredMeals - mealsInTop.length);
        topCandidates = [...topCandidates, ...remainingMeals];
      }

      this.onProgress("Checking details...");
      // Parallel enrichment with batching
      const batchSize = 10;
      for (let i = 0; i < topCandidates.length; i += batchSize) {
        if (i % 20 === 0) this.onProgress(`Checking details (${i}/${topCandidates.length})...`);
        const batch = topCandidates.slice(i, i + batchSize);
        await Promise.all(batch.map((c) => discovery.enrichFromGoogle(c)));
      }

      // 4. Scheduling
      this.onProgress("Assembling your journey...");
      const scheduler = new SchedulerEngine(this.prefs);
      itinerary = await scheduler.assembleItinerary(topCandidates);

      // 5. Sparse Day Check
      // A day is sparse if it ends before 5:00 PM (17:00)
      const hasSparseDay = itinerary.days.some((day) => {
        if (day.activities.length === 0) return true;
        const lastActivity = day.activities[day.activities.length - 1];
        // Parse "19:30" -> 19
        const endHour = parseInt(lastActivity.endTime.split(":")[0], 10);
        return endHour < 17;
      });

      if (!hasSparseDay) {
        console.log(`[Engine] Itinerary looks full. Finishing.`);
        break;
      }

      console.log(`[Engine] Sparse day detected. Retrying with more candidates... (Retry ${retryCount})`);
      retryCount++;
    }

    if (!itinerary) throw new Error("Failed to generate itinerary");

    this.onProgress("Finalizing details...");
    return itinerary;
  }
}
