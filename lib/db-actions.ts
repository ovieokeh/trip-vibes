"use server";

import { db } from "./db";
import { archetypes, cities, places, archetypesToPlaces } from "./db/schema";
import { eq, inArray, sql } from "drizzle-orm";
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
