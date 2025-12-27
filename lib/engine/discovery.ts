import { db } from "../db";
import { places } from "../db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { EngineCandidate, UserPreferences } from "../types";
import { ARCHETYPES } from "../archetypes";
import { CATEGORIES } from "../categories";
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
   * 2. If insufficient, fetch from Foursquare using Category IDs.
   */
  async findCandidates(city: { id: string; name: string; slug: string; country: string }): Promise<EngineCandidate[]> {
    // 1. Identify relevant category IDs based on user vibes
    const targetCategoryIds = this.mapVibesToCategoryIds();

    // 2. Search DB
    let candidates = await this.searchDB(city.id, targetCategoryIds);

    // 3. Fallback/Enrichment
    if (candidates.length < 20 && process.env.FOURSQUARE_API_KEY) {
      console.log(`[Discovery] Insufficient candidates (${candidates.length}). Fetching from Foursquare...`);
      await this.fetchFromFoursquare(city, targetCategoryIds);
      // Re-fetch from DB to get the newly inserted places
      candidates = await this.searchDB(city.id, targetCategoryIds);
    }

    // 4. Google Enrichment (Lazy - done later or on demand, but we can do a quick pass here for top candidates if needed?
    // The original engine did it later. Let's keep it separate/later to save quota.)

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

    allTags.forEach((tag) => {
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

    return results.map(this.mapRowToCandidate);
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

  private async fetchFromFoursquare(city: { name: string; id: string; country: string }, categoryIds: string[]) {
    if (!process.env.FOURSQUARE_API_KEY) return;

    // Convert to top-level category IDs
    const topLevelIds = new Set<string>();
    categoryIds.forEach((id) => {
      topLevelIds.add(this.getTopLevelCategoryId(id));
    });

    // Foursquare allows comma separated category IDs
    // Limit to 50 ids per call?
    const idsToSearch = Array.from(topLevelIds).slice(0, 50).join(",");

    console.log("Fetching from Foursquare", city.name, idsToSearch);

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

      console.log("Foursquare response", res.data.results);

      for (const fsq of res.data.results) {
        await this.savePlace(fsq, city.id);
      }
    } catch (e) {
      console.error("Foursquare error", e);
    }
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

  private async savePlace(fsq: FoursquarePlace, cityId: string) {
    if (!fsq.fsq_place_id) return;

    const metadata = {
      categories: fsq.categories?.map((c: any) => c.name) || [], // Store names for now (legacy compat)
      categoryIds: fsq.categories?.map((c: any) => c.id) || [], // NEW: Store IDs
      source: "foursquare",
      social: fsq.social_media,
    };

    await db
      .insert(places)
      .values({
        id: uuidv4(),
        foursquareId: fsq.fsq_place_id,
        name: fsq.name,
        address: fsq.location?.formatted_address,
        lat: fsq.latitude ?? 0,
        lng: fsq.longitude ?? 0,
        cityId: cityId,
        metadata: JSON.stringify(metadata),
        website: fsq.website,
        phone: fsq.tel,
        rating: null, // we don't have rating for now
      })
      .onConflictDoNothing();
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
