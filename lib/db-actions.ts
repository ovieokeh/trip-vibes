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

export async function generateItineraryAction(prefs: UserPreferences): Promise<Itinerary> {
  // Try lookup by ID first, then by Slug
  let city = await db.select().from(cities).where(eq(cities.id, prefs.cityId)).get();
  if (!city) {
    city = await db.select().from(cities).where(eq(cities.slug, prefs.cityId)).get();
  }

  if (!city) throw new Error(`City not found: ${prefs.cityId}`);

  // 1. Get liked archetypes
  const likedArchs = await db.select().from(archetypes).where(inArray(archetypes.id, prefs.likedVibes)).all();

  // 2. Fetch associated places for these archetypes in this city
  // This is where "The Architect" happens.
  // For now, we fetch the mapped places. In a real app, this would trigger an API search if cache is cold.

  const placesWithArchs = await db
    .select({
      place: places,
      archetypeId: archetypesToPlaces.archetypeId,
    })
    .from(places)
    .innerJoin(archetypesToPlaces, eq(places.id, archetypesToPlaces.placeId))
    .where(sql`${places.cityId} = ${city.id} AND ${archetypesToPlaces.archetypeId} IN ${likedArchs.map((a) => a.id)}`)
    .all();

  const candidates = placesWithArchs.map((p) => ({
    ...p.place,
    metadata: JSON.parse(p.place.metadata || "{}"),
  }));

  // Simple slotting logic (Architect 2.0)
  const days: DayPlan[] = [];
  const startDate = new Date(prefs.startDate);
  const endDate = new Date(prefs.endDate);
  const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  let candidateIdx = 0;

  for (let i = 0; i < dayCount; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const activities: TripActivity[] = [];

    // Morning
    if (candidateIdx < candidates.length) {
      activities.push({
        id: generateId(),
        vibe: {
          id: candidates[candidateIdx].id,
          title: candidates[candidateIdx].name,
          description: candidates[candidateIdx].address || "Local gem",
          imageUrl: candidates[candidateIdx].imageUrl || "",
          category: "culture",
          tags: [],
          cityId: city.id,
        },
        startTime: "10:00",
        endTime: "12:00",
        note: "Start your day with some vibe.",
        isAlternative: false,
      });
      candidateIdx++;
    }

    // Afternoon
    if (candidateIdx < candidates.length) {
      activities.push({
        id: generateId(),
        vibe: {
          id: candidates[candidateIdx].id,
          title: candidates[candidateIdx].name,
          description: candidates[candidateIdx].address || "Exploring...",
          imageUrl: candidates[candidateIdx].imageUrl || "",
          category: "culture",
          tags: [],
          cityId: city.id,
        },
        startTime: "14:00",
        endTime: "16:30",
        note: "The afternoon exploration.",
        isAlternative: false,
      });
      candidateIdx++;
    }

    days.push({
      id: generateId(),
      dayNumber: i + 1,
      date: currentDate.toISOString().split("T")[0],
      activities,
      neighborhood: activities[0]?.vibe.neighborhood || "Central",
    });
  }

  return {
    id: generateId(),
    cityId: city.id,
    days,
    createdAt: new Date().toISOString(),
  };
}
