"use server";

import { db } from "./db";
import { archetypes, cities, places, archetypesToPlaces, itineraries } from "./db/schema";
import { eq, inArray, sql, desc, and } from "drizzle-orm";
import { UserPreferences, Itinerary, DayPlan, TripActivity } from "./types";
import { v4 as uuidv4 } from "uuid";

export async function getVibeArchetypes() {
  return await db.select().from(archetypes).all();
}

export async function getCities() {
  return await db.select().from(cities).all();
}

export async function getCityById(id: string) {
  return await db.select().from(cities).where(eq(cities.id, id)).get();
}

export async function getCityBySlug(slug: string) {
  return await db.select().from(cities).where(eq(cities.slug, slug)).get();
}

function generateId() {
  return uuidv4();
}

import { MatchingEngine } from "./engine/engine";
import { getCachedItinerary, cacheItinerary, getVibeDescription } from "./engine/architect";

export async function generateItineraryAction(prefs: UserPreferences): Promise<Itinerary> {
  // 1. Check full itinerary cache
  const cached = await getCachedItinerary(prefs.cityId, prefs);
  if (cached) {
    return JSON.parse(cached.data);
  }

  // 2. Run Matching Engine
  const engine = new MatchingEngine(prefs);
  const itinerary = await engine.generate();

  // 3. Enrich with AI Descriptive Layer (and cache descriptions)
  for (const day of itinerary.days) {
    for (const activity of day.activities) {
      // Find the vibe that matched this place (naive: just use first liked vibe for now)
      // In a real app, the engine would pass which vibe matched which place.
      const matchedVibeId = prefs.likedVibes[0];
      const vibe = await db.select().from(archetypes).where(eq(archetypes.id, matchedVibeId)).get();

      const vibeDesc = await getVibeDescription(
        matchedVibeId,
        activity.vibe.id,
        activity.vibe.title,
        vibe?.title || "Great vibe"
      );

      activity.note = vibeDesc.note;
      if (vibeDesc.alternativeNote) {
        activity.alternative = {
          title: "Alternative Option",
          note: vibeDesc.alternativeNote,
        };
      }
    }
  }

  // 4. Cache full itinerary
  await cacheItinerary(prefs.cityId, prefs, itinerary);

  return itinerary;
}

export async function saveItineraryAction(id: string, name?: string) {
  await db
    .update(itineraries)
    .set({ isSaved: true, name: name || "My Trip" })
    .where(eq(itineraries.id, id));
}

export async function getSavedItinerariesAction() {
  const saved = await db
    .select({
      id: itineraries.id,
      cityId: itineraries.cityId,
      name: itineraries.name,
      startDate: itineraries.startDate,
      endDate: itineraries.endDate,
      createdAt: itineraries.createdAt,
      city: cities.name,
      country: cities.country,
    })
    .from(itineraries)
    .leftJoin(cities, eq(itineraries.cityId, cities.id))
    .where(eq(itineraries.isSaved, true))
    .orderBy(desc(itineraries.createdAt))
    .all();

  return saved;
}

export async function getItineraryByIdAction(id: string): Promise<Itinerary | null> {
  const record = await db.select().from(itineraries).where(eq(itineraries.id, id)).get();
  if (record) {
    return JSON.parse(record.data);
  }
  return null;
}
