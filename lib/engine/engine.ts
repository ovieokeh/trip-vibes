import { db } from "../db";
import { places, archetypesToPlaces, cities } from "../db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { UserPreferences, Itinerary, DayPlan, TripActivity, Vibe } from "../types";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

// Environment variables for APIs
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export class MatchingEngine {
  private prefs: UserPreferences;

  constructor(prefs: UserPreferences) {
    this.prefs = prefs;
  }

  async generate(): Promise<Itinerary> {
    const city = await db.select().from(cities).where(eq(cities.id, this.prefs.cityId)).get();
    if (!city) {
      // Try slug lookup
      const cityBySlug = await db.select().from(cities).where(eq(cities.slug, this.prefs.cityId)).get();
      if (!cityBySlug) throw new Error("City not found");
      this.prefs.cityId = cityBySlug.id;
    }

    // 1. Discovery Phase: Find places matching liked vibes
    let candidates = await this.discoverPlaces();

    // 2. Data Enrichment: If we have few candidates, hit the external APIs
    if (candidates.length < 5) {
      // Lower threshold for testing
      await this.enrichFromExternalAPIs(city!);
      candidates = await this.discoverPlaces();
    }

    // 3. Optimization Phase: Geographic clustering and Time slotting
    return this.assembleItinerary(candidates);
  }

  private async discoverPlaces() {
    if (!this.prefs.likedVibes.length) return [];

    const results = await db
      .select({
        place: places,
      })
      .from(places)
      .innerJoin(archetypesToPlaces, eq(places.id, archetypesToPlaces.placeId))
      .where(
        sql`${places.cityId} = ${this.prefs.cityId} AND ${archetypesToPlaces.archetypeId} IN ${this.prefs.likedVibes}`
      )
      .all();

    return results.map((r) => ({
      ...r.place,
      metadata: JSON.parse(r.place.metadata || "{}"),
    }));
  }

  private async enrichFromExternalAPIs(city: any) {
    console.log("Enriching data from external APIs...");
    // Logic to call Foursquare/Google would go here and populate DB
  }

  private assembleItinerary(candidates: any[]): Itinerary {
    const days: DayPlan[] = [];
    const startDate = new Date(this.prefs.startDate);
    const endDate = new Date(this.prefs.endDate);
    const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let candidateIdx = 0;

    for (let i = 0; i < dayCount; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dayActivities: TripActivity[] = [];

      const slots = ["Morning", "Afternoon", "Evening"];
      for (const slot of slots) {
        if (candidateIdx < candidates.length) {
          const p = candidates[candidateIdx];
          dayActivities.push({
            id: uuidv4(),
            vibe: {
              id: p.id,
              title: p.name,
              description: p.address || "Local discovery",
              imageUrl: p.imageUrl || "",
              category: "culture",
              cityId: p.cityId,
              tags: [],
              lat: p.lat,
              lng: p.lng,
              neighborhood: p.metadata.neighborhood,
            },
            startTime: slot === "Morning" ? "10:00" : slot === "Afternoon" ? "14:00" : "19:00",
            endTime: slot === "Morning" ? "12:00" : slot === "Afternoon" ? "16:30" : "21:30",
            note: "",
            isAlternative: false,
            transitNote: "15 min walk", // Dummy transit buffer
          });
          candidateIdx++;
        }
      }

      days.push({
        id: uuidv4(),
        dayNumber: i + 1,
        date: currentDate.toISOString().split("T")[0],
        activities: dayActivities,
        neighborhood: dayActivities[0]?.vibe.neighborhood || "Central",
      });
    }

    return {
      id: uuidv4(),
      cityId: this.prefs.cityId,
      days,
      createdAt: new Date().toISOString(),
    };
  }
}
