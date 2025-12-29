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
  private onProgress: (key: string, params?: Record<string, any>) => void;

  constructor(prefs: UserPreferences, onProgress?: (key: string, params?: Record<string, any>) => void) {
    this.prefs = prefs;
    this.onProgress = onProgress || (() => {});
  }

  async generate(): Promise<Itinerary> {
    this.onProgress("initializing");

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
    let dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);

    // Enforce 14-day limit
    if (dayCount > 14) {
      console.log(`[Engine] Capping trip from ${dayCount} to 14 days`);
      dayCount = 14;
    }

    // START: Smart Retry Logic
    // Scale candidates by trip length
    // Target: 5 activities per day to fill 9am-7:30pm gap
    const activitiesPerDay = 5;
    let minMeals = Math.max(20, dayCount * 4);
    let minActivities = Math.max(30, dayCount * activitiesPerDay); // 8 days = 40 activities

    let retryCount = 0;
    const MAX_RETRIES = 2; // Increased to 2 retries for hard cases
    let itinerary: Itinerary | null = null;

    while (retryCount <= MAX_RETRIES) {
      if (retryCount > 0) {
        this.onProgress("expanding_search", {
          attempt: retryCount + 1,
          total: MAX_RETRIES + 1,
        });
        // Dynamic increase on retry
        minActivities += dayCount * 5;
        minMeals += dayCount * 2;
      }

      this.onProgress("scouting_vibes", {
        city: city.name,
        days: dayCount,
      });
      const discovery = new DiscoveryEngine(this.prefs);

      // Fetch with forceRefresh on retry to ensure we get new Foursquare data
      const candidates = await discovery.findCandidates(
        city,
        { minMeals, minActivities },
        this.prefs.forceRefresh || retryCount > 0
      );

      // 2. Scoring
      this.onProgress("ranking_options", { count: candidates.length });
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

      this.onProgress("checking_details");
      // Parallel enrichment with batching
      const batchSize = 10;
      for (let i = 0; i < topCandidates.length; i += batchSize) {
        if (i % 20 === 0) {
          this.onProgress("checking_details_progress", {
            current: i,
            total: topCandidates.length,
          });
        }
        const batch = topCandidates.slice(i, i + batchSize);
        await Promise.all(batch.map((c) => discovery.enrichFromGoogle(c)));
      }

      // 4. Scheduling
      this.onProgress("assembling_journey");
      const scheduler = new SchedulerEngine(this.prefs);
      const cityCoords =
        city.lat && city.lng
          ? { lat: city.lat, lng: city.lng }
          : topCandidates.length > 0
          ? { lat: topCandidates[0].lat, lng: topCandidates[0].lng }
          : undefined;
      itinerary = await scheduler.assembleItinerary(topCandidates, cityCoords);

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

    this.onProgress("finalizing");
    return itinerary;
  }
}
