import { db } from "../db";
import { places } from "../db/schema";
import { eq, and, or, sql, inArray } from "drizzle-orm";
import { EngineCandidate, UserPreferences } from "../types";
import { ARCHETYPES } from "../archetypes";
import { CATEGORIES } from "../categories";
import { isMeal, isActivity } from "./utils";
import { generateSearchZones, SearchZone } from "../geo";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

interface FoursquarePlaceLocation {
  address: string;
  locality: string;
  region: string;
  postcode: string;
  country: string;
  formatted_address: string;
}
interface FoursquarePlace {
  fsq_place_id: string;
  latitude: number;
  longitude: number;
  categories: {
    fsq_category_id: string;
    name: string;
    short_name: string;
    plural_name: string;
    icon: {
      prefix: string;
      suffix: string;
    };
  }[];
  date_created: string;
  date_refreshed: string;
  distance: number;
  extended_location: unknown;
  link: string;
  location: FoursquarePlaceLocation;
  name: string;
  placemaker_url: string;
  tel: string;
  website: string;
  social_media: Record<string, string>;
}

export class DiscoveryEngine {
  private prefs: UserPreferences;

  constructor(prefs: UserPreferences) {
    this.prefs = prefs;
  }

  /**
   * Primary method to find candidates.
   * 1. Search DB for matching categories.
   * 2. If insufficient, fetch from Foursquare using geo-exploration (or name fallback).
   */
  async findCandidates(
    city: { id: string; name: string; slug: string; country: string; lat?: number | null; lng?: number | null },
    requirements: { minMeals: number; minActivities: number }
  ): Promise<EngineCandidate[]> {
    // 1. Identify relevant category IDs based on user vibes
    const targetCategoryIds = this.mapVibesToCategoryIds();

    // 2. Search DB
    let candidates = await this.searchDB(city.id, targetCategoryIds);

    // 3. Fallback/Enrichment via Foursquare Geo-Exploration
    const meals = candidates.filter(isMeal);
    const activities = candidates.filter(isActivity);

    const needsMeals = meals.length < requirements.minMeals;
    const needsActivities = activities.length < requirements.minActivities;

    if ((needsMeals || needsActivities) && process.env.FOURSQUARE_API_KEY) {
      console.log(
        `[Discovery] Insufficient balance. Meals: ${meals.length}/${requirements.minMeals}, Activities: ${activities.length}/${requirements.minActivities}`
      );

      // Use geo-exploration if city has coordinates
      if (city.lat && city.lng) {
        await this.fetchWithGeoExploration(city, targetCategoryIds, requirements);
      } else {
        // Fallback to name-based search (single zone)
        await this.fetchFromFoursquareByName(city, targetCategoryIds);
      }

      // Re-fetch from DB
      candidates = await this.searchDB(city.id, targetCategoryIds);
    }

    return candidates;
  }

  public async enrichFromGoogle(place: EngineCandidate) {
    if (!process.env.GOOGLE_PLACES_API_KEY) return;
    try {
      let googleId = place.googlePlacesId;
      if (!googleId) {
        const search = await axios.get("https://maps.googleapis.com/maps/api/place/findplacefromtext/json", {
          params: {
            input: `${place.name} ${place.address}`,
            inputtype: "textquery",
            fields: "place_id",
            key: process.env.GOOGLE_PLACES_API_KEY,
          },
        });
        googleId = search.data.candidates?.[0]?.place_id;
      }

      if (!googleId) return;

      const details = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
        params: {
          place_id: googleId,
          fields: "opening_hours,website,formatted_phone_number,photos,rating",
          key: process.env.GOOGLE_PLACES_API_KEY,
        },
      });

      const res = details.data.result;
      if (!res) return;

      await db
        .update(places)
        .set({
          googlePlacesId: googleId,
          website: res.website || null,
          phone: res.formatted_phone_number || null,
          openingHours: res.opening_hours ? JSON.stringify(res.opening_hours) : null,
          photoUrls: JSON.stringify(res.photos || []),
          rating: res.rating || place.rating,
        })
        .where(eq(places.id, place.id));

      // Update in-memory reference
      place.openingHours = res.opening_hours;
      place.photos = res.photos || [];
      place.rating = res.rating || place.rating;
    } catch (e) {
      console.error("Google Enrichment Error", e);
    }
  }

  private mapVibesToCategoryIds(): string[] {
    const relevantArchetypes = ARCHETYPES.filter((a) => this.prefs.likedVibes.includes(a.id));
    const allTags = new Set<string>();

    // Collect tags from Archetypes
    relevantArchetypes.forEach((a) => a.tags.forEach((t) => allTags.add(t.toLowerCase())));

    // Collect tags from Weights (if highly weighted)
    Object.entries(this.prefs.vibeProfile?.weights || {}).forEach(([trait, weight]) => {
      if (weight > 6) allTags.add(trait.toLowerCase());
    });

    // Map tags to Foursquare Category IDs using the generated CATEGORIES map
    const matchedIds = new Set<string>();

    const categoryValues = Object.values(CATEGORIES);

    // ALWAYS include base food categories to ensure we have restaurants
    const mandatoryTags = ["restaurant", "cafe", "bakery", "food"];
    const tagsToSearch = new Set([...allTags, ...mandatoryTags]);

    tagsToSearch.forEach((tag) => {
      // Find category where name matches tag (fuzzy)
      // e.g. tag "park" matches category "Park", "National Park", etc.
      // We prioritize exact matches or "end with" matches

      categoryValues.forEach((cat) => {
        const catName = cat.name.toLowerCase();
        if (catName === tag || catName.includes(tag) || tag.includes(catName)) {
          matchedIds.add(cat.id);
          // Also add all children?
          // No, Foursquare API usually handles "category_id" as explicit.
          // But for DB search, we might want children.
        }
      });
    });

    return Array.from(matchedIds);
  }

  private async searchDB(cityId: string, categoryIds: string[]): Promise<EngineCandidate[]> {
    if (categoryIds.length === 0) return [];

    // Strategy 1: Search by Expanded Category IDs (Preferred)
    // We expand the request category IDs to include all children.
    // KEY FIX: We first map to Top Level categories to broaden scope (match Foursquare logic),
    // ensuring we find siblings/cousins (e.g. 'Restaurant' input finds 'Cafe' result).
    const topLevelIds = categoryIds.map((id) => this.getTopLevelCategoryId(id));
    const expandedIds = this.expandCategoryIds(topLevelIds);
    // Limit to prevent huge queries? 200 should be fine for Postgres.

    // We want places where metadata->'categoryIds' contains ANY of expandedIds.
    // Postgres JSONB: metadata->'categoryIds' ?| array['id1', 'id2']

    // Strategy 2: Text Search on Names (Fallback)
    const targetNames = categoryIds
      .map((id) => CATEGORIES[id]?.name)
      .filter(Boolean)
      .slice(0, 20);
    const textConditions = targetNames.map((term) => sql`metadata::jsonb->>'categories' ILIKE ${`%${term}%`}`);

    // Combine conditions: CityID AND (CategoryIDs overlap OR Text search)
    let whereClause = eq(places.cityId, cityId);

    let matchCondition = undefined;

    if (expandedIds.length > 0) {
      // Drizzle doesn't have native `?|` operator helper perfectly typed sometimes, use sql
      // Note: We cast metadata to jsonb.
      const idsArray = sql`ARRAY[${sql.join(expandedIds, sql`, `)}]`;
      const idMatch = sql`metadata::jsonb->'categoryIds' ?| ${idsArray}`;

      if (textConditions.length > 0) {
        matchCondition = or(idMatch, ...textConditions);
      } else {
        matchCondition = idMatch;
      }
    } else if (textConditions.length > 0) {
      matchCondition = or(...textConditions);
    }

    if (!matchCondition) return [];

    const results = await db.select().from(places).where(and(whereClause, matchCondition));

    // Deduplicate results by foursquareId
    const uniqueMap = new Map<string, typeof places.$inferSelect>();
    for (const r of results) {
      if (r.foursquareId) {
        if (!uniqueMap.has(r.foursquareId)) {
          uniqueMap.set(r.foursquareId, r);
        }
      } else {
        // Fallback: use ID as key if no fsq id (shouldn't happen for fsq sources but good safety)
        uniqueMap.set(r.id, r);
      }
    }

    return Array.from(uniqueMap.values()).map(this.mapRowToCandidate);
  }

  private expandCategoryIds(ids: string[]): string[] {
    const set = new Set<string>(ids);
    const queue = [...ids];

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (CATEGORIES[id]) {
        for (const child of CATEGORIES[id].children) {
          if (!set.has(child)) {
            set.add(child);
            queue.push(child);
          }
        }
      }
    }
    return Array.from(set);
  }

  /**
   * Geo-exploration: Fetches candidates by searching multiple zones around city center.
   * Uses hybrid parallel approach: batches of 2 zones with early exit checks.
   * This balances speed (parallel) with cost savings (early exit).
   */
  private async fetchWithGeoExploration(
    city: { id: string; name: string; country: string; lat?: number | null; lng?: number | null },
    categoryIds: string[],
    requirements: { minMeals: number; minActivities: number }
  ) {
    if (!process.env.FOURSQUARE_API_KEY || !city.lat || !city.lng) return;

    const zones = generateSearchZones(city.lat, city.lng, 6); // 6km offset
    const idsToSearch = this.prepareCategoryIds(categoryIds);

    // Batch zones into groups of 2 for parallel fetching with early exit
    const BATCH_SIZE = 2;
    const zoneBatches = this.chunkArray(zones, BATCH_SIZE);

    console.log(
      `[Geo-Exploration] Starting with ${zones.length} zones in ${zoneBatches.length} batches for ${city.name}`
    );

    for (const batch of zoneBatches) {
      // Check if we already have enough candidates (early exit check)
      const currentCandidates = await this.searchDB(city.id, categoryIds);
      const meals = currentCandidates.filter(isMeal);
      const activities = currentCandidates.filter(isActivity);

      if (meals.length >= requirements.minMeals && activities.length >= requirements.minActivities) {
        console.log(
          `[Geo-Exploration] Requirements met. Meals: ${meals.length}, Activities: ${activities.length}. Skipping remaining batches.`
        );
        break;
      }

      console.log(`[Geo-Exploration] Fetching batch of ${batch.length} zones in parallel...`);

      // Fetch all zones in this batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(async (zone) => {
          try {
            const res = await axios.get<{ results: FoursquarePlace[] }>(
              "https://places-api.foursquare.com/places/search",
              {
                params: {
                  ll: `${zone.lat},${zone.lng}`,
                  radius: 5000,
                  limit: 50,
                  categories: idsToSearch,
                },
                headers: {
                  Authorization: `Bearer ${process.env.FOURSQUARE_API_KEY}`,
                  "x-places-api-version": "2025-06-17",
                },
              }
            );
            console.log(`[Geo-Exploration] Zone "${zone.id}": ${res.data.results.length} places`);
            return { zone, places: res.data.results };
          } catch (e) {
            console.error(`[Geo-Exploration] Error fetching zone ${zone.id}:`, e);
            return { zone, places: [] };
          }
        })
      );

      // Collect all places from successful fetches
      const allPlaces: FoursquarePlace[] = [];
      for (const result of batchResults) {
        if (result.status === "fulfilled" && result.value.places.length > 0) {
          allPlaces.push(...result.value.places);
        }
      }

      // Batch save all places at once
      if (allPlaces.length > 0) {
        await this.savePlacesBatch(allPlaces, city.id);
        console.log(`[Geo-Exploration] Batch saved ${allPlaces.length} places`);
      }
    }
  }

  /**
   * Splits an array into chunks of specified size.
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Fallback: Fetches candidates using city name (when no coordinates available).
   */
  private async fetchFromFoursquareByName(city: { name: string; id: string; country: string }, categoryIds: string[]) {
    if (!process.env.FOURSQUARE_API_KEY) return;

    const idsToSearch = this.prepareCategoryIds(categoryIds);

    console.log(`[Discovery] Fetching by name: ${city.name}, ${city.country}`);

    try {
      const res = await axios.get<{ results: FoursquarePlace[] }>("https://places-api.foursquare.com/places/search", {
        params: {
          near: `${city.name}, ${city.country}`,
          limit: 50,
          categories: idsToSearch,
        },
        headers: {
          Authorization: `Bearer ${process.env.FOURSQUARE_API_KEY}`,
          "x-places-api-version": "2025-06-17",
        },
      });

      console.log(`[Discovery] Foursquare response: ${res.data.results.length} places`);

      await Promise.all(res.data.results.map((fsq) => this.savePlace(fsq, city.id)));
    } catch (e) {
      console.error("[Discovery] Foursquare error", e);
    }
  }

  /**
   * Prepares category IDs for Foursquare API call.
   */
  private prepareCategoryIds(categoryIds: string[]): string {
    const topLevelIds = new Set<string>();
    categoryIds.forEach((id) => {
      topLevelIds.add(this.getTopLevelCategoryId(id));
    });
    return Array.from(topLevelIds).slice(0, 50).join(",");
  }

  public getTopLevelCategoryId(id: string): string {
    let currentId = id;
    let node = CATEGORIES[currentId];

    // Traverse up until parentId is null
    // Guard against potential circular loops or missing nodes (max depth 10)
    let depth = 0;
    while (node && node.parentId && depth < 10) {
      currentId = node.parentId;
      node = CATEGORIES[currentId];
      depth++;
    }

    return currentId;
  }

  /**
   * Batch save multiple places at once for better performance.
   * Uses a single query to check for existing places, then bulk inserts new ones.
   */
  private async savePlacesBatch(fsqPlaces: FoursquarePlace[], cityId: string) {
    if (fsqPlaces.length === 0) return;

    // Filter out invalid places
    const validPlaces = fsqPlaces.filter((fsq) => fsq.fsq_place_id);
    if (validPlaces.length === 0) return;

    // Get all foursquare IDs we're trying to save
    const fsqIds = validPlaces.map((fsq) => fsq.fsq_place_id!);

    // Single query to find all existing places
    const existing = await db
      .select({ foursquareId: places.foursquareId })
      .from(places)
      .where(and(inArray(places.foursquareId, fsqIds), eq(places.cityId, cityId)));

    const existingIds = new Set(existing.map((e) => e.foursquareId));

    // Filter to only new places (not already in DB)
    const newPlaces = validPlaces.filter((fsq) => !existingIds.has(fsq.fsq_place_id!));

    if (newPlaces.length === 0) {
      console.log(`[Discovery] All ${validPlaces.length} places already cached`);
      return;
    }

    // Bulk insert new places
    const insertValues = newPlaces.map((fsq) => ({
      id: uuidv4(),
      foursquareId: fsq.fsq_place_id!,
      name: fsq.name,
      address: fsq.location?.formatted_address,
      lat: fsq.latitude ?? 0,
      lng: fsq.longitude ?? 0,
      cityId: cityId,
      metadata: JSON.stringify({
        categories: fsq.categories?.map((c: any) => c.name) || [],
        categoryIds: fsq.categories?.map((c: any) => c.id) || [],
        source: "foursquare",
        social: fsq.social_media,
      }),
      website: fsq.website,
      phone: fsq.tel,
      rating: null,
    }));

    await db.insert(places).values(insertValues);
    console.log(`[Discovery] Inserted ${newPlaces.length} new places (${existingIds.size} already cached)`);
  }

  /**
   * Single place save (kept for backwards compatibility with name-based search).
   */
  private async savePlace(fsq: FoursquarePlace, cityId: string) {
    await this.savePlacesBatch([fsq], cityId);
  }

  private mapRowToCandidate(row: typeof places.$inferSelect): EngineCandidate {
    let meta: any = {};
    try {
      meta = JSON.parse(row.metadata || "{}");
    } catch (e) {}

    let photoData = [];
    try {
      photoData = JSON.parse(row.photoUrls || "[]");
    } catch (e) {}
    const isRich = photoData.length > 0 && typeof photoData[0] === "object";

    return {
      ...row,
      metadata: meta,
      openingHours: row.openingHours ? JSON.parse(row.openingHours) : undefined,
      photoUrls: !isRich ? photoData : [],
      photos: isRich ? photoData : [],
    } as EngineCandidate;
  }
}
