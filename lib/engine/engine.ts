import { db } from "../db";
import { places, archetypesToPlaces, cities, archetypes } from "../db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { UserPreferences, Itinerary, DayPlan, TripActivity, Vibe, EngineCandidate } from "../types";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { getTravelDetails } from "../geo";

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
    if (candidates.length < 5) {
      this.onProgress("Expanding search to external sources...");
      await this.enrichFromFoursquare(city!);
      candidates = await this.discoverPlacesInDB();
    }

    // 3. Deep Enrichment
    this.onProgress("Verifying opening hours and details...");
    let checkedCount = 0;
    // Batch process in chunks to speed up but respect rate limits
    for (let i = 0; i < candidates.length; i += 5) {
      const chunk = candidates.slice(i, i + 5);
      await Promise.all(
        chunk.map(async (p) => {
          if (!p.website || !p.openingHours) {
            await this.enrichFromGoogle(p);
          }
          checkedCount++;
          if (checkedCount % 5 === 0) {
            this.onProgress(`Analyzing ${checkedCount} of ${candidates.length} matches...`);
          }
        })
      );
    }

    // 4. Optimization Phase
    this.onProgress("Optimizing route and schedule...");
    return this.assembleItinerary(candidates as EngineCandidate[]);
  }

  private async discoverPlacesInDB() {
    if (!this.prefs.likedVibes.length) return [];

    const results = await db
      .select({
        place: places,
      })
      .from(places)
      .innerJoin(archetypesToPlaces, eq(places.id, archetypesToPlaces.placeId))
      .where(
        sql`${places.cityId} = ${this.prefs.cityId} AND ${archetypesToPlaces.archetypeId} IN ${this.prefs.likedVibes}`
      );

    return results.map((r) => {
      const dbPhotos = r.place.photoUrls ? JSON.parse(r.place.photoUrls) : [];
      // Check if dbPhotos is array of strings or objects.
      // If objects, assign to photos; if strings, assign to photoUrls
      const isRich = dbPhotos.length > 0 && typeof dbPhotos[0] === "object";

      return {
        ...r.place,
        metadata: JSON.parse(r.place.metadata || "{}"),
        openingHours: r.place.openingHours ? JSON.parse(r.place.openingHours) : null,
        photoUrls: !isRich ? dbPhotos : [],
        photos: isRich ? dbPhotos : [],
      };
    });
  }

  private async enrichFromFoursquare(city: { id: string; name: string }) {
    if (!FOURSQUARE_API_KEY) {
      console.warn("FOURSQUARE_API_KEY missing. Skipping discovery.");
      return;
    }

    // Get the tags from liked archetypes
    const likedArchs = await db.select().from(archetypes).where(inArray(archetypes.id, this.prefs.likedVibes));
    const searchTerms = likedArchs.flatMap((a) => a.searchTags.split(","));

    for (const term of searchTerms.slice(0, 5)) {
      // Limit to avoid hitting limits too hard
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
            const placeId = uuidv4();
            await db.insert(places).values({
              id: placeId,
              foursquareId: fsqId,
              name: fsqPlace.name,
              address: fsqPlace.location?.formatted_address,
              lat: lat ?? 0,
              lng: lng ?? 0,
              rating: null, // Rating causes 429
              priceLevel: 1, // Price causes 429
              cityId: city.id,
              imageUrl: null, // Photos cause 429/not present in default
              metadata: JSON.stringify({
                categories: fsqPlace.categories?.map((c: { name: string }) => c.name) || [],
                source: "foursquare",
                website: fsqPlace.website,
                phone: fsqPlace.tel,
              }),
            });

            // Map to current archetypes (simple keyword matching)
            for (const arch of likedArchs) {
              if (arch.searchTags.toLowerCase().includes(term.toLowerCase())) {
                await db.insert(archetypesToPlaces).values({
                  archetypeId: arch.id,
                  placeId: placeId,
                });
              }
            }
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
      // 1. Text Search or Find Place to get Google ID if missing
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

        // Save rich photo data
        const richPhotos = details?.photos || [];

        await db
          .update(places)
          .set({
            googlePlacesId: googleId,
            website: details?.website || null,
            phone: details?.formatted_phone_number || null,
            openingHours: details?.opening_hours ? JSON.stringify(details.opening_hours) : null,
            // Store rich objects in the text field (it's big, but sqlite can handle it)
            photoUrls: JSON.stringify(richPhotos),
            rating: details?.rating || place.rating,
          })
          .where(eq(places.id, place.id));

        place.website = details?.website;
        place.phone = details?.formatted_phone_number;
        place.openingHours = details?.opening_hours;
        place.photos = richPhotos;

        // Construct Image URL if photos exist for immediate display usage
        if (richPhotos?.length > 0) {
          const ref = richPhotos[0].photo_reference;
          // Use local proxy
          place.imageUrl = `/api/places/photo?maxwidth=800&ref=${ref}`;
          // Also update DB
          await db.update(places).set({ imageUrl: place.imageUrl }).where(eq(places.id, place.id));
        }
      }
    } catch (error) {
      console.error(`Google Places error for ${place.name}:`, error);
    }
  }

  private assembleItinerary(candidates: EngineCandidate[]): Itinerary {
    const days: DayPlan[] = [];
    const startDate = new Date(this.prefs.startDate);
    const endDate = new Date(this.prefs.endDate);
    const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let candidateIdx = 0;

    for (let i = 0; i < dayCount; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dayActivities: TripActivity[] = [];

      const slots = [
        { name: "Morning", start: "10:00", end: "12:00" },
        { name: "Afternoon", start: "14:00", end: "16:30" },
        { name: "Evening", start: "19:00", end: "21:30" },
      ];

      for (const [, slot] of slots.entries()) {
        // Find a candidate that is open
        let chosenCandidate = null;
        let attempts = 0;

        // Loop through candidates until we find one that is open or run out
        while (candidateIdx < candidates.length && !chosenCandidate && attempts < candidates.length) {
          const p = candidates[candidateIdx];

          if (this.isPlaceOpen(p, currentDate, slot.start, slot.end)) {
            chosenCandidate = p;
            candidateIdx++;
          } else {
            // If closed, move strictly forward for now (simple heuristic)
            candidateIdx++;
          }
          attempts++;
        }

        // Fallback: If ran out, try to pick previous unused or wrapped (simplified)
        if (!chosenCandidate && candidates.length > 0) {
          // Just take mod if we ran out
          chosenCandidate = candidates[candidateIdx % candidates.length];
          candidateIdx++;
        }

        if (chosenCandidate) {
          // Attempt to find an alternative
          let altCandidate = null;
          if (candidateIdx < candidates.length) {
            // simplified alt logic
            altCandidate = candidates[candidateIdx];
            candidateIdx++;
          }

          // Calculate transit from previous activity if exists
          let transitNote = "";
          let transitDetails = undefined;

          if (dayActivities.length > 0) {
            const prevActivity = dayActivities[dayActivities.length - 1];
            // Get previous lat/lng from the vibe object
            if (prevActivity.vibe.lat && prevActivity.vibe.lng && chosenCandidate.lat && chosenCandidate.lng) {
              const details = getTravelDetails(
                prevActivity.vibe.lat,
                prevActivity.vibe.lng,
                chosenCandidate.lat,
                chosenCandidate.lng
              );
              transitDetails = details;

              // Backwards compat string
              transitNote = `${details.durationMinutes} min ${details.mode}`;
            } else {
              transitNote = "Getting there"; // Generic fallback if coords missing
            }
          } else {
            // From hotel/start?
            transitNote = "Start of day";
          }

          dayActivities.push({
            id: uuidv4(),
            vibe: this.mapCandidateToVibe(chosenCandidate),
            startTime: slot.start,
            endTime: slot.end,
            note: "",
            isAlternative: false,
            transitNote: transitNote,
            transitDetails: transitDetails,
            alternative: altCandidate ? this.mapCandidateToVibe(altCandidate) : undefined,
          });
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

  private isPlaceOpen(place: EngineCandidate, date: Date, startTime: string, endTime: string): boolean {
    if (!place.openingHours?.periods) return true; // Assume open if no data

    const dayIndex = date.getDay(); // 0 = Sunday
    const startInt = parseInt(startTime.replace(":", ""));
    const endInt = parseInt(endTime.replace(":", ""));

    // Google Periods: { open: { day: 0, time: "1000" }, close: { day: 0, time: "1700" } }
    const periods = place.openingHours.periods;

    return periods.some((period: { open: { day: number; time: string }; close?: { day: number; time: string } }) => {
      // Simple case: Open and Close on same day
      if (period.open.day === dayIndex) {
        const openTime = parseInt(period.open.time);

        // If no close time, usually means 24h?
        if (!period.close) return true;

        // If close day is different (e.g. next day), effective close time for THIS day logic is complex
        // but for now, if close.day != open.day, it closes strictly AFTER this day, so it's open for the rest of this day.
        if (period.close.day !== period.open.day) {
          return startInt >= openTime;
        }

        const closeTime = parseInt(period.close.time);
        return startInt >= openTime && endInt <= closeTime;
      }
      return false;
    });
  }

  private mapCandidateToVibe(p: any): Vibe {
    return {
      id: p.id,
      title: p.name,
      description: p.address || "Local discovery",
      imageUrl: p.imageUrl || "",
      category: p.metadata.categories?.[0] || "culture",
      cityId: p.cityId,
      tags: [],
      lat: p.lat,
      lng: p.lng,
      neighborhood: p.metadata.neighborhood,
      website: p.website,
      phone: p.phone,
      openingHours: p.openingHours,
      photos:
        p.photos?.map((photo: Record<string, unknown>) => ({
          ...photo,
          // Use local proxy
          url: `/api/places/photo?maxwidth=400&ref=${String(photo.photo_reference)}`,
        })) || [],
      rating: p.rating,
      address: p.address,
    };
  }
}
