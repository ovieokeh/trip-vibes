import { db } from "../db";
import { places, archetypesToPlaces, cities, archetypes } from "../db/schema";
import { eq, inArray, sql, and, like, or } from "drizzle-orm";
import { UserPreferences, Itinerary, DayPlan, TripActivity, Vibe, EngineCandidate, VibeCategory } from "../types";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { getTravelDetails } from "../geo";
import { ARCHETYPES } from "../archetypes";

// Environment variables for APIs
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export class MatchingEngine {
  private prefs: UserPreferences;
  private onProgress: (msg: string) => void;

  constructor(prefs: UserPreferences, onProgress?: (msg: string) => void) {
    this.prefs = prefs;
    this.onProgress = onProgress || (() => {});
  }

  async generate(): Promise<Itinerary> {
    this.onProgress("Initializing engine...");
    const city = (await db.select().from(cities).where(eq(cities.id, this.prefs.cityId)).limit(1))[0];
    if (!city) {
      // Try slug lookup
      const cityBySlug = (await db.select().from(cities).where(eq(cities.slug, this.prefs.cityId)).limit(1))[0];
      if (!cityBySlug) throw new Error("City not found");
      this.prefs.cityId = cityBySlug.id;
    }

    // 1. Discovery Phase
    this.onProgress(`Scouting best vibes in ${city?.name || "the city"}...`);
    let candidates = await this.discoverPlacesInDB();

    // 2. Data Enrichment
    if (candidates.length < 10) {
      this.onProgress("Expanding search to external sources...");
      await this.enrichFromFoursquare(city!);
      candidates = await this.discoverPlacesInDB();
    }

    // 3. Scoring & Ranking
    this.onProgress("Applying your vibe profile...");
    candidates = this.rankCandidates(candidates);

    // 4. Deep Enrichment (Details) for top candidates
    this.onProgress("Verifying opening hours and details...");
    let checkedCount = 0;
    // Only check top 30 to save quota
    const topCandidates = candidates.slice(0, 30);

    // Batch process in chunks
    for (let i = 0; i < topCandidates.length; i += 5) {
      const chunk = topCandidates.slice(i, i + 5);
      await Promise.all(
        chunk.map(async (p) => {
          if (!p.website || !p.openingHours) {
            await this.enrichFromGoogle(p);
          }
          checkedCount++;
          if (checkedCount % 5 === 0) {
            // optional progress update
          }
        })
      );
    }

    // 5. Optimization Phase
    this.onProgress("Optimizing route and schedule...");
    return this.assembleItinerary(topCandidates as EngineCandidate[]);
  }

  private async discoverPlacesInDB(): Promise<EngineCandidate[]> {
    // Strategy:
    // 1. If we have explicit `likedVibes` (legacy or from deck), use explicitly linked places.
    // 2. Also search by tags derived from high-weight traits in `vibeProfile`.

    // Get search tags from profile
    const highWeightTraits = Object.entries(this.prefs.vibeProfile?.weights || {})
      .filter(([, weight]) => weight > 0)
      .map(([trait]) => trait);

    // Find archetypes that match these traits
    // In our simplified model, the 'weights' keys (nature, luxury) map loosely to categories.
    // But we also have explicit `likedVibes`.
    // Let's rely on `likedVibes` IDs to get the `ARCHETYPES` definitions, then get their tags.
    const relevantArchetypes = ARCHETYPES.filter((a) => this.prefs.likedVibes.includes(a.id));
    const searchTags = new Set<string>();
    relevantArchetypes.forEach((a) => a.tags.forEach((t) => searchTags.add(t)));

    // Also add explicit traits just in case
    highWeightTraits.forEach((t) => searchTags.add(t));

    // If no tags, fallback to generic
    if (searchTags.size === 0) return [];

    // DB Query: Find places in this city that match tags in their metadata
    // This is a naive 'like' query. In production, use Full Text Search.
    const conditions = Array.from(searchTags).map((tag) => like(places.metadata, `%${tag}%`));

    // Chunk conditions to avoid too large query
    // Actually, just fetch by City and filter in memory if dataset is small (<1000 per city)
    // For now, let's fetch all in city and filter JS side for flexibility
    const cityPlaces = await db.select().from(places).where(eq(places.cityId, this.prefs.cityId));

    return cityPlaces
      .map((r) => {
        const dbPhotos = r.photoUrls ? JSON.parse(r.photoUrls) : [];
        const isRich = dbPhotos.length > 0 && typeof dbPhotos[0] === "object";

        const p = {
          ...r,
          metadata: JSON.parse(r.metadata || "{}"),
          openingHours: r.openingHours ? JSON.parse(r.openingHours) : null,
          photoUrls: !isRich ? dbPhotos : [],
          photos: isRich ? dbPhotos : [],
        };

        return p;
      })
      .filter((p) => {
        // Filter: Match at least one tag? Or return all and let ranker handle it?
        // Let's return all and let ranker handle it (it's robust).
        // But maybe exclude totally irrelevant ones?
        // Naive filter:
        const catStr = (p.metadata.categories || []).join(" ").toLowerCase();
        return Array.from(searchTags).some((t) => catStr.includes(t.toLowerCase()));
      });
  }

  private rankCandidates(candidates: EngineCandidate[]): EngineCandidate[] {
    const weights = this.prefs.vibeProfile?.weights || {};

    // Helper to map place categories/tags to our weight keys
    // This is the "Mapping" part.
    // We need a mapping from Foursquare Categories -> Our Traits (Nature, Luxury, etc)
    // Since we don't have a strict map, we use keyword matching.

    return candidates
      .map((p) => {
        let score = 0;
        const meta = p.metadata;
        const catStr = (meta.categories || []).join(" ").toLowerCase() + " " + p.name.toLowerCase();

        // 1. Trait Matching
        for (const [trait, weight] of Object.entries(weights)) {
          // If place matches trait keyword, applying weight
          // e.g. trait="nature", weight=10. Place has "Park". Match!
          // We need a synonym list.
          // Simple version: direct match or synonym
          if (this.isMatch(catStr, trait)) {
            score += weight * 2;
          }
        }

        // 2. Base Quality
        score += (p.rating || 0) * 5;

        // 3. Image Bonus
        if (p.imageUrl || p.photos?.length) score += 10;

        // Store score on object for debugging?
        // (p as any)._debug_score = score;

        return { ...p, _score: score };
      })
      .sort((a: any, b: any) => b._score - a._score);
  }

  private isMatch(text: string, trait: string): boolean {
    // Simple synonym map
    const synonyms: Record<string, string[]> = {
      nature: ["park", "garden", "beach", "forest", "hike", "tree"],
      urban: ["street", "city", "plaza", "building", "architecture"],
      food: ["restaurant", "cafe", "bakery", "market", "food"],
      nightlife: ["bar", "club", "pub", "lounge", "drink"],
      culture: ["museum", "art", "gallery", "history", "theater"],
      luxury: ["fine dining", "upscale", "hotel", "spa", "wine"],
      adventure: ["climb", "hike", "activity", "escape"],
      relaxing: ["spa", "yoga", "quiet", "book", "tea"],
      history: ["museum", "ruins", "castle", "historic"],
      social: ["market", "park", "bar", "play"],
      quiet: ["library", "book", "quiet", "garden"],
      energy: ["club", "gym", "activity"],
    };

    const words = synonyms[trait] || [trait];
    return words.some((w) => text.includes(w));
  }

  private async enrichFromFoursquare(city: { id: string; name: string }) {
    if (!FOURSQUARE_API_KEY) return;

    // Use tags from VibeProfile + Liked Vibes
    const relevantArchetypes = ARCHETYPES.filter((a) => this.prefs.likedVibes.includes(a.id));
    let searchTerms = relevantArchetypes.flatMap((a) => a.tags); // Use explicit tags

    // Dedupe
    searchTerms = Array.from(new Set(searchTerms));

    // Limit to top 5-10 terms
    searchTerms = searchTerms.slice(0, 8);

    console.log("Searching Foursquare for:", searchTerms);

    for (const term of searchTerms) {
      try {
        const response = await axios.get("https://places-api.foursquare.com/places/search", {
          params: {
            query: term,
            near: city.name,
            limit: 10,
          },
          headers: {
            Authorization: `Bearer ${FOURSQUARE_API_KEY}`,
            Accept: "application/json",
            "x-places-api-version": "2025-06-17",
          },
        });

        for (const fsqPlace of response.data.results) {
          // Upsert to DB
          const fsqId = fsqPlace.fsq_id || fsqPlace.fsq_place_id;
          if (!fsqId) continue;

          // Coordinate handling: Top-level lat/lng in this endpoint response
          let lat = fsqPlace.latitude;
          let lng = fsqPlace.longitude;

          // Fallback to geocodes.main if top-level is missing
          if (lat === undefined || lng === undefined) {
            lat = fsqPlace.geocodes?.main?.latitude;
            lng = fsqPlace.geocodes?.main?.longitude;
          }

          const existing = (await db.select().from(places).where(eq(places.foursquareId, fsqId)).limit(1))[0];
          if (!existing) {
            await db.insert(places).values({
              id: uuidv4(),
              foursquareId: fsqId,
              name: fsqPlace.name,
              address: fsqPlace.location?.formatted_address,
              lat: lat ?? 0,
              lng: lng ?? 0,
              rating: null, // Rating causes 429
              priceLevel: null, // Price causes 429
              cityId: city.id,
              imageUrl: null,
              metadata: JSON.stringify({
                categories: fsqPlace.categories?.map((c: { name: string }) => c.name) || [],
                source: "foursquare",
                website: fsqPlace.website,
                phone: fsqPlace.tel,
              }),
            });
          }
        }
      } catch (error) {
        console.error(`Foursquare error for term ${term}:`, error);
      }
    }
  }

  private async enrichFromGoogle(place: EngineCandidate) {
    if (!GOOGLE_PLACES_API_KEY) return;
    try {
      let googleId = place.googlePlacesId;
      if (!googleId) {
        const searchRes = await axios.get("https://maps.googleapis.com/maps/api/place/findplacefromtext/json", {
          params: {
            input: place.name,
            inputtype: "textquery",
            locationbias: `point:${place.lat},${place.lng}`,
            fields: "place_id",
            key: GOOGLE_PLACES_API_KEY,
          },
        });
        googleId = searchRes.data.candidates?.[0]?.place_id;
      }

      if (googleId) {
        const detailsRes = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
          params: {
            place_id: googleId,
            fields: "opening_hours,website,formatted_phone_number,photos,rating",
            key: GOOGLE_PLACES_API_KEY,
          },
        });

        const details = detailsRes.data.result;
        const richPhotos = details?.photos || [];

        await db
          .update(places)
          .set({
            googlePlacesId: googleId,
            website: details?.website || null,
            phone: details?.formatted_phone_number || null,
            openingHours: details?.opening_hours ? JSON.stringify(details.opening_hours) : null,
            photoUrls: JSON.stringify(richPhotos),
            rating: details?.rating || place.rating,
          })
          .where(eq(places.id, place.id));

        place.website = details?.website;
        place.phone = details?.formatted_phone_number;
        place.openingHours = details?.opening_hours;
        place.photos = richPhotos;
        if (richPhotos?.length > 0) {
          place.imageUrl = `/api/places/photo?maxwidth=800&ref=${richPhotos[0].photo_reference}`;
          await db.update(places).set({ imageUrl: place.imageUrl }).where(eq(places.id, place.id));
        }
      }
    } catch (error) {
      // Silent fail
    }
  }

  private assembleItinerary(candidates: EngineCandidate[]): Itinerary {
    // Basic greedy assembly logic
    const days: DayPlan[] = [];
    const startDate = new Date(this.prefs.startDate);
    const endDate = new Date(this.prefs.endDate);
    const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let candidateIdx = 0;

    const usedPlaceIds = new Set<string>();

    for (let i = 0; i < dayCount; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayActivities: TripActivity[] = [];
      const slots = [
        { name: "Morning", start: "10:00", end: "12:00" },
        { name: "Afternoon", start: "13:30", end: "16:00" },
        { name: "Evening", start: "19:00", end: "21:30" },
      ];

      for (const slot of slots) {
        // Cycle through candidates to find an unused one
        let attempts = 0;
        let p: EngineCandidate | null = null;

        while (attempts < candidates.length) {
          if (candidateIdx >= candidates.length) candidateIdx = 0;
          const candidate = candidates[candidateIdx];
          if (!usedPlaceIds.has(candidate.id)) {
            p = candidate;
            usedPlaceIds.add(candidate.id);
            candidateIdx++; // Move next for next search
            break;
          }
          candidateIdx++;
          attempts++;
        }

        if (!p) {
          // If we ran out of unique places, skip this slot or fallback?
          // Skipping is safer to avoid duplicates.
          continue;
        }

        dayActivities.push({
          id: uuidv4(),
          vibe: this.mapCandidateToVibe(p),
          startTime: slot.start,
          endTime: slot.end,
          note: this.generateNote(p, slot.name),
          isAlternative: false,
          transitNote: "Short walk",
        });
      }

      days.push({
        id: uuidv4(),
        dayNumber: i + 1,
        date: currentDate.toISOString().split("T")[0],
        activities: dayActivities,
        neighborhood: "Central",
      });
    }

    return {
      id: uuidv4(),
      cityId: this.prefs.cityId,
      days,
      createdAt: new Date().toISOString(),
    };
  }

  private generateNote(p: EngineCandidate, timeOfDay: string): string {
    return `Enjoy ${timeOfDay} at ${p.name}.`;
  }

  private mapCandidateToVibe(p: any): Vibe {
    if (!p) throw new Error("Candidate is undefined");
    return {
      id: p.id,
      title: p.name,
      description: p.address || "",
      imageUrl: p.imageUrl || "",
      category: p.metadata?.categories?.[0] || "custom",
      cityId: p.cityId,
      tags: [],
      lat: p.lat,
      lng: p.lng,
      website: p.website,
      phone: p.phone,
      openingHours: p.openingHours,
      photos:
        p.photos?.map((photo: any) => ({
          ...photo,
          url: `/api/places/photo?maxwidth=400&ref=${photo.photo_reference}`,
        })) || [],
      rating: p.rating,
      address: p.address,
    };
  }
}
