"use server";

import { revalidatePath } from "next/cache";

import { db } from "./db";
import { archetypes, cities, places, itineraries, vibeDecks } from "./db/schema";
import { eq, sql, desc, and, ilike, or } from "drizzle-orm";
import { UserPreferences, Itinerary, Vibe } from "./types";
import { v4 as uuidv4 } from "uuid";
import { searchGoogleCities, getGooglePlaceDetails } from "./google-places";
import { generateDefaultTripName } from "./formatting";
import { isPlaceOpenAt } from "./activity";

export async function getVibeArchetypes() {
  return await db.select().from(archetypes);
}

export async function getCities() {
  return await db.select().from(cities);
}

export async function getCityById(id: string) {
  return (await db.select().from(cities).where(eq(cities.id, id)).limit(1))[0];
}

export async function getCityBySlug(slug: string) {
  return (await db.select().from(cities).where(eq(cities.slug, slug)).limit(1))[0];
}

export async function searchCitiesAction(query: string) {
  console.log(`[Search] Query: "${query}"`);
  if (!query || query.length < 2) return [];

  // 1. Search DB First (Acts as "Recent Searches" / Cache)
  const dbResults = await db
    .select()
    .from(cities)
    .where(or(ilike(cities.name, `%${query}%`), ilike(cities.country, `%${query}%`)))
    .limit(10);

  console.log(`[Search] DB hits: ${dbResults.length}`);

  // If we have enough results, return immediately (Speed!)
  if (dbResults.length >= 5) {
    return dbResults;
  }

  // 2. Fallback to Google Places (if local results are scarce)
  // Run in background if we wanted to be super optmistic, but for accurate results we await.
  const googleResults = await searchGoogleCities(query);
  console.log(`[Search] Google hits: ${googleResults.length}`);

  if (!googleResults.length) {
    return dbResults;
  }

  // 3. Ingest new cities from Google
  // process in parallel for speed
  const ingestionPromises = googleResults.map(async (prediction) => {
    try {
      // Always fetch details to get the Country for accurate deduplication
      const details = await getGooglePlaceDetails(prediction.place_id);
      if (!details) return null;

      // Extract country
      const countryComponent = details.address_components.find((c) => c.types.includes("country"));
      const country = countryComponent ? countryComponent.long_name : "Unknown";
      const name = details.name;

      // Check existence by Name AND Country
      const existing = (
        await db
          .select()
          .from(cities)
          .where(
            and(
              sql`lower(${cities.name}) = ${name.toLowerCase()}`,
              sql`lower(${cities.country}) = ${country.toLowerCase()}`
            )
          )
          .limit(1)
      )[0];

      if (existing) {
        // Already exists, return it, so we can merge it into results if it wasn't already there
        return existing;
      }

      console.log(`[Search] Ingesting: ${name}, ${country}`);

      // Generate slug
      let slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Ensure slug uniqueness
      const slugExists = (await db.select().from(cities).where(eq(cities.slug, slug)).limit(1))[0];
      if (slugExists) {
        slug = `${slug}-${uuidv4().slice(0, 4)}`;
      }

      const [inserted] = await db
        .insert(cities)
        .values({
          slug,
          name,
          country,
          // Capture coordinates for geo-exploration
          lat: details.geometry?.location?.lat || null,
          lng: details.geometry?.location?.lng || null,
        })
        .returning();

      return inserted;
    } catch (err) {
      console.error(`[Search] Error processing prediction`, err);
      return null;
    }
  });

  const processed = await Promise.all(ingestionPromises);
  const newOrExistingFromGoogle = processed.filter((c): c is NonNullable<typeof c> => c !== null);

  // 4. Merge and Return
  // Combine initial DB results + newly ingested cities
  // Filter duplicates just in case
  const combined = [...dbResults, ...newOrExistingFromGoogle];

  // Deduplicate by ID
  const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());

  return unique;
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
      const vibe = (await db.select().from(archetypes).where(eq(archetypes.id, matchedVibeId)).limit(1))[0];

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
  let finalName = name;

  // Generate default name if missing
  if (!finalName && itineraryData) {
    const city = (await db.select().from(cities).where(eq(cities.id, itineraryData.cityId)).limit(1))[0];
    if (city) {
      finalName = generateDefaultTripName(city.name, itineraryData.startDate || "", itineraryData.endDate || "");
    } else {
      finalName = "My Trip";
    }
  }

  await db
    .update(itineraries)
    .set({
      isSaved: true,
      name: finalName || "My Trip",
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
    .orderBy(desc(itineraries.createdAt));

  return saved;
}

export async function getItineraryByIdAction(id: string): Promise<Itinerary | null> {
  const record = (await db.select().from(itineraries).where(eq(itineraries.id, id)).limit(1))[0];
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
  revalidatePath("/saved");
}

export async function getFallbackImageAction(query: string) {
  return await getRandomImageForCategory(query);
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
    // No activities yet - use default context (0,0 effectively skips distance scoring)
    // NOTE: Could enhance by adding city center lat/lng to cities table in the future
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
    .limit(50); // Fetch a decent chunk to rank
  // In real app, might want to filter by category or something first if too many

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

      // B. Opening Hours Score - use shared utility for consistent behavior
      const timeStr = `${contextTime.getHours().toString().padStart(2, "0")}:${contextTime
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      const isOpen = isPlaceOpenAt(openingHours, contextTime, timeStr);
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

      // Parse photos from DB - these are Google Places photo objects stored as JSON
      let photoData: any[] = [];
      try {
        photoData = JSON.parse(p.photoUrls || "[]");
      } catch (e) {}
      const hasRichPhotos = photoData.length > 0 && typeof photoData[0] === "object";

      // Construct Vibe object
      const vibe: Vibe = {
        id: p.id,
        title: p.name,
        description: p.address || "",
        imageUrl: p.imageUrl || "",
        category: cats[0] || "custom",
        cityId: p.cityId,
        tags: [],
        lat: pLat,
        lng: pLng,
        rating: p.rating || undefined,
        openingHours: openingHours,
        distanceFromContext: dist, // Helper property for UI
        phone: p.phone || undefined,
        website: p.website || undefined,
        priceLevel: p.priceLevel || undefined,
        // Map photos with proper URL generation from photo_reference
        photos: hasRichPhotos
          ? photoData.map((photo: any) => ({
              ...photo,
              url: photo.url || (photo.photo_reference ? `/api/places/photo?ref=${photo.photo_reference}` : ""),
            }))
          : [],
        // Also populate photoUrls for backward compat - simple string array
        photoUrls: !hasRichPhotos && Array.isArray(photoData) ? photoData : [],
      };

      return { vibe, score, placeRow: p, hasPhotos: hasRichPhotos };
    });

  // Sort by score desc
  scored.sort((a, b) => b.score - a.score);

  const top5 = scored.slice(0, 5);

  // 5. On-demand Google enrichment for suggestions without photos
  // This ensures the Add Activity modal shows images
  if (process.env.GOOGLE_PLACES_API_KEY) {
    const { DiscoveryEngine } = await import("./engine/discovery");
    const discovery = new DiscoveryEngine({
      cityId,
      startDate: "",
      endDate: "",
      budget: "medium",
      likedVibes: [],
      dislikedVibes: [],
      vibeProfile: { weights: {}, swipes: 0 },
    });

    const needsEnrichment = top5.filter((s) => !s.hasPhotos);
    if (needsEnrichment.length > 0) {
      // Enrich in parallel (limit to 5 at a time to be nice to Google API)
      const toEnrich = needsEnrichment.slice(0, 5);
      await Promise.all(
        toEnrich.map(async (s) => {
          const candidate = {
            id: s.placeRow.id,
            foursquareId: s.placeRow.foursquareId,
            googlePlacesId: s.placeRow.googlePlacesId,
            cityId: s.placeRow.cityId,
            name: s.placeRow.name,
            address: s.placeRow.address,
            lat: s.placeRow.lat || 0,
            lng: s.placeRow.lng || 0,
            rating: s.placeRow.rating,
            website: s.placeRow.website,
            phone: s.placeRow.phone,
            imageUrl: s.placeRow.imageUrl,
            metadata: JSON.parse(s.placeRow.metadata || "{}"),
          };
          await discovery.enrichFromGoogle(candidate);
        })
      );

      // Re-fetch enriched places from DB and update vibes
      const enrichedIds = toEnrich.map((s) => s.placeRow.id);
      const enrichedPlaces = await db
        .select()
        .from(places)
        .where(sql`${places.id} IN (${sql.join(enrichedIds, sql`, `)})`);

      for (const ep of enrichedPlaces) {
        const idx = top5.findIndex((s) => s.placeRow.id === ep.id);
        if (idx !== -1) {
          let photoData: any[] = [];
          try {
            photoData = JSON.parse(ep.photoUrls || "[]");
          } catch (e) {}
          const hasRichPhotos = photoData.length > 0 && typeof photoData[0] === "object";

          top5[idx].vibe.photos = hasRichPhotos
            ? photoData.map((photo: any) => ({
                ...photo,
                url: photo.url || (photo.photo_reference ? `/api/places/photo?ref=${photo.photo_reference}` : ""),
              }))
            : [];
          top5[idx].vibe.rating = ep.rating || top5[idx].vibe.rating;
        }
      }
    }
  }

  return top5.map((s) => s.vibe);
}

// ==================== VIBE DECKS ====================

import { VibeProfile } from "./vibes/types";

export interface VibeDeck {
  id: string;
  name: string;
  likedVibes: string[];
  vibeProfile: VibeProfile;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export async function saveVibeDeckAction(
  name: string,
  likedVibes: string[],
  vibeProfile: VibeProfile
): Promise<VibeDeck> {
  const [inserted] = await db
    .insert(vibeDecks)
    .values({
      name,
      likedVibes: JSON.stringify(likedVibes),
      vibeProfile: JSON.stringify(vibeProfile),
    })
    .returning();

  return {
    id: inserted.id,
    name: inserted.name,
    likedVibes: JSON.parse(inserted.likedVibes),
    vibeProfile: JSON.parse(inserted.vibeProfile),
    createdAt: inserted.createdAt,
    updatedAt: inserted.updatedAt,
  };
}

export async function getVibeDecksAction(): Promise<VibeDeck[]> {
  const decks = await db.select().from(vibeDecks).orderBy(desc(vibeDecks.createdAt));

  return decks.map((d) => ({
    id: d.id,
    name: d.name,
    likedVibes: JSON.parse(d.likedVibes),
    vibeProfile: JSON.parse(d.vibeProfile),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}

export async function getVibeDeckByIdAction(id: string): Promise<VibeDeck | null> {
  const deck = (await db.select().from(vibeDecks).where(eq(vibeDecks.id, id)).limit(1))[0];

  if (!deck) return null;

  return {
    id: deck.id,
    name: deck.name,
    likedVibes: JSON.parse(deck.likedVibes),
    vibeProfile: JSON.parse(deck.vibeProfile),
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  };
}

export async function deleteVibeDeckAction(id: string): Promise<void> {
  await db.delete(vibeDecks).where(eq(vibeDecks.id, id));
}

export async function renameVibeDeckAction(id: string, name: string): Promise<void> {
  await db.update(vibeDecks).set({ name, updatedAt: new Date() }).where(eq(vibeDecks.id, id));
}
