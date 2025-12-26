"use server";

import { revalidatePath } from "next/cache";

import { db } from "./db";
import { archetypes, cities, places, archetypesToPlaces, itineraries } from "./db/schema";
import { eq, inArray, sql, desc, and, like, or } from "drizzle-orm";
import { UserPreferences, Itinerary, DayPlan, TripActivity } from "./types";
import { v4 as uuidv4 } from "uuid";
import { searchGoogleCities, getGooglePlaceDetails } from "./google-places";

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

export async function searchCitiesAction(query: string) {
  if (!query || query.length < 2) return [];

  // 1. Search DB
  const dbResults = await db
    .select()
    .from(cities)
    .where(or(like(cities.name, `%${query}%`), like(cities.country, `%${query}%`)))
    .limit(10)
    .all();

  // 2. If we have good matches (exact start match or enough results), return them
  const hasExactMatch = dbResults.some((c) => c.name.toLowerCase() === query.toLowerCase());
  if (dbResults.length >= 5 || hasExactMatch) {
    return dbResults;
  }

  // 3. Fallback to Google Places
  const googleResults = await searchGoogleCities(query);

  if (!googleResults.length) return dbResults;

  // 4. Ingest new cities
  for (const prediction of googleResults) {
    // Only process if it looks like a city (google usually filters well with (cities) type)
    const existing = await db
      .select()
      .from(cities)
      .where(sql`lower(${cities.name}) = ${prediction.structured_formatting.main_text.toLowerCase()}`)
      .get();

    if (!existing) {
      // Fetch details to get country
      const details = await getGooglePlaceDetails(prediction.place_id);
      if (details) {
        // Extract country
        const countryComponent = details.address_components.find((c: any) => c.types.includes("country"));
        const country = countryComponent ? countryComponent.long_name : "Unknown";
        const name = details.name;

        // Generate slug
        let slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        // Ensure slug uniqueness (simple check)
        const slugExists = await db.select().from(cities).where(eq(cities.slug, slug)).get();
        if (slugExists) {
          slug = `${slug}-${uuidv4().slice(0, 4)}`;
        }

        await db.insert(cities).values({
          slug,
          name,
          country,
        });
      }
    }
  }

  // 5. Re-fetch from DB to get the newly added ones
  const finalResults = await db
    .select()
    .from(cities)
    .where(or(like(cities.name, `%${query}%`), like(cities.country, `%${query}%`)))
    .limit(20)
    .all();

  return finalResults;
}

function generateId() {
  return uuidv4();
}

import { MatchingEngine } from "./engine/engine";
import { getCachedItinerary, cacheItinerary, getVibeDescription } from "./engine/architect";
import { getRandomImageForCategory } from "./unsplash";

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
      // If there is an alternative (set by engine), we could potentially enrich its note too, but for now let's leave it.
      if (activity.alternative && vibeDesc.alternativeNote) {
        // Optionally append the AI note to the alternative's description or just ignore
        // activity.alternative.description = vibeDesc.alternativeNote;
      }
    }
  }

  // 4. Cache full itinerary
  await cacheItinerary(prefs.cityId, prefs, itinerary);

  return itinerary;
}

export async function saveItineraryAction(id: string, name?: string, itineraryData?: Itinerary) {
  await db
    .update(itineraries)
    .set({
      isSaved: true,
      name: name || "My Trip",
      ...(itineraryData ? { data: JSON.stringify(itineraryData) } : {}),
    })
    .where(eq(itineraries.id, id));

  revalidatePath("/saved");
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
    const data = JSON.parse(record.data);
    return {
      ...data,
      name: record.name,
      startDate: record.startDate,
      endDate: record.endDate,
    };
  }
  return null;
}

export async function renameItineraryAction(id: string, name: string) {
  await db.update(itineraries).set({ name }).where(eq(itineraries.id, id));
}

export async function deleteItineraryAction(id: string) {
  await db.delete(itineraries).where(eq(itineraries.id, id));
}

export async function getFallbackImageAction(query: string) {
  return await getRandomImageForCategory(query);
}

// Helper: Check if place is open
function isPlaceOpen(place: any, dateTime: Date): boolean {
  if (!place.openingHours?.periods) return true; // Assume open if no data

  const dayIndex = dateTime.getDay(); // 0 = Sunday
  const startInt = dateTime.getHours() * 100 + dateTime.getMinutes();

  const periods = place.openingHours.periods;

  return periods.some((period: any) => {
    if (period.open.day === dayIndex) {
      const openTime = parseInt(period.open.time);
      if (!period.close) return true; // 24h?
      if (period.close.day !== period.open.day) {
        // Closes next day, so it is open for the rest of this day
        return startInt >= openTime;
      }
      const closeTime = parseInt(period.close.time);
      return startInt >= openTime && startInt < closeTime;
    }
    return false;
  });
}

import { calculateHaversineDistance } from "./geo";

export async function getActivitySuggestionsAction(cityId: string, currentItinerary: Itinerary, dayId: string) {
  // 1. Context Setup
  const day = currentItinerary.days.find((d) => d.id === dayId);
  if (!day) return [];

  // Determine context time and location
  let contextLat = 0;
  let contextLng = 0;
  let contextTime = new Date(`${day.date}T10:00:00`); // Default start time

  if (day.activities.length > 0) {
    const lastAct = day.activities[day.activities.length - 1];
    contextLat = lastAct.vibe.lat || 0;
    contextLng = lastAct.vibe.lng || 0;
    // Parse end time "HH:MM"
    const [h, m] = lastAct.endTime.split(":").map(Number);
    contextTime = new Date(`${day.date}T${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`);
  } else {
    // If no activities, try to find city center or use first activity of previous day?
    // For now, let's just use the city object to find center if possible, or skip distance scoring
    const city = await db.select().from(cities).where(eq(cities.id, cityId)).get();
    // We don't have city lat/lng in types easily, but let's assume 0,0 implies "don't score distance"
  }

  // 2. Exclude existing
  const excludedIds = new Set<string>();
  currentItinerary.days.forEach((d) => {
    d.activities.forEach((a) => {
      excludedIds.add(a.vibe.id);
      if (a.alternative) excludedIds.add(a.alternative.id);
    });
  });

  // 3. Fetch Candidates
  // We want places in this city that are not in excludedIds.
  // We can join with archetypes to get categories if needed, but places table has metadata.
  const candidates = await db
    .select()
    .from(places)
    .where(and(eq(places.cityId, cityId)))
    .limit(50) // Fetch a decent chunk to rank
    .all(); // In real app, might want to filter by category or something first if too many

  // 4. Score and Rank
  const scored = candidates
    .filter((p) => !excludedIds.has(p.id))
    .map((p) => {
      let score = 0;

      // Parse fields
      const meta = JSON.parse(p.metadata || "{}");
      const openingHours = p.openingHours ? JSON.parse(p.openingHours) : null;
      const pLat = p.lat || 0;
      const pLng = p.lng || 0;
      const rating = p.rating || 3.0;

      // A. Proximity Score (if we have context)
      let dist = 0;
      if (contextLat && contextLng && pLat && pLng) {
        dist = calculateHaversineDistance(contextLat, contextLng, pLat, pLng);
        // Bonus for being close (e.g., < 2km)
        // Decay score: 10 points * (1 / (distance + 1))
        score += 20 * (1 / (dist + 0.5));
      }

      // B. Opening Hours Score
      const isOpen = isPlaceOpen({ openingHours }, contextTime);
      if (!isOpen) {
        score -= 50; // Heavy penalty if closed
      } else {
        score += 10;
      }

      // C. Base Quality Score
      score += rating * 2; // Up to 10 points

      // D. Time of Day Category Synergy
      const hour = contextTime.getHours();
      const cats = meta.categories || [];
      const catStr = cats.join(" ").toLowerCase();

      // Morning (8-11)
      if (hour >= 8 && hour < 11) {
        if (catStr.includes("cafe") || catStr.includes("breakfast") || catStr.includes("park")) score += 15;
      }
      // Lunch (11-14)
      if (hour >= 11 && hour < 14) {
        if (catStr.includes("restaurant") || catStr.includes("food")) score += 15;
      }
      // Afternoon (14-18)
      if (hour >= 14 && hour < 18) {
        if (catStr.includes("museum") || catStr.includes("gallery") || catStr.includes("shopping")) score += 15;
      }
      // Evening/Night (18+)
      if (hour >= 18) {
        if (catStr.includes("bar") || catStr.includes("pub") || catStr.includes("club") || catStr.includes("dinner"))
          score += 15;
      }

      // Construct Vibe object
      const vibe: any = {
        id: p.id,
        title: p.name,
        description: p.address || "",
        imageUrl: p.imageUrl || "",
        category: cats[0] || "custom",
        cityId: p.cityId,
        tags: [],
        lat: pLat,
        lng: pLng,
        rating: p.rating,
        openingHours: openingHours,
        distanceFromContext: dist, // Helper property for UI
      };

      return { vibe, score };
    });

  // Sort by score desc
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 20).map((s) => s.vibe);
}
