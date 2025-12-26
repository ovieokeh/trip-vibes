import { pgTable, text, doublePrecision, integer, boolean, timestamp, primaryKey, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const cities = pgTable("cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const archetypes = pgTable("archetypes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  searchTags: text("search_tags").notNull(), // Comma-separated tags
  createdAt: timestamp("created_at").defaultNow(),
});

export const places = pgTable("places", {
  id: uuid("id").primaryKey().defaultRandom(),
  foursquareId: text("foursquare_id"),
  googlePlacesId: text("google_places_id"),
  name: text("name").notNull(),
  address: text("address"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  imageUrl: text("image_url"),
  rating: doublePrecision("rating"),
  priceLevel: integer("price_level").default(1),
  website: text("website"),
  phone: text("phone"),
  openingHours: text("opening_hours"), // JSON stringified
  photoUrls: text("photo_urls"), // JSON stringified array
  cityId: uuid("city_id")
    .notNull()
    .references(() => cities.id),
  metadata: text("metadata"), // JSON stringified blob
  createdAt: timestamp("created_at").defaultNow(),
});

export const archetypesToPlaces = pgTable(
  "archetypes_to_places",
  {
    archetypeId: uuid("archetype_id")
      .notNull()
      .references(() => archetypes.id),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.archetypeId, t.placeId] }),
  })
);

// Relations
export const citiesRelations = relations(cities, ({ many }) => ({
  places: many(places),
}));

export const archetypesRelations = relations(archetypes, ({ many }) => ({
  places: many(archetypesToPlaces),
}));

export const placesRelations = relations(places, ({ one, many }) => ({
  city: one(cities, {
    fields: [places.cityId],
    references: [cities.id],
  }),
  archetypes: many(archetypesToPlaces),
}));

export const archetypesToPlacesRelations = relations(archetypesToPlaces, ({ one }) => ({
  archetype: one(archetypes, {
    fields: [archetypesToPlaces.archetypeId],
    references: [archetypes.id],
  }),
  place: one(places, {
    fields: [archetypesToPlaces.placeId],
    references: [places.id],
  }),
}));

export const itineraries = pgTable("itineraries", {
  id: uuid("id").primaryKey().defaultRandom(),
  cityId: uuid("city_id")
    .notNull()
    .references(() => cities.id),
  preferencesHash: text("preferences_hash").notNull(), // Hash of likedVibes, dates, budget
  data: text("data").notNull(), // JSON stringified Itinerary
  isSaved: boolean("is_saved").default(false),
  name: text("name"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vibeDescriptionsCache = pgTable("vibe_descriptions_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  vibeId: text("vibe_id").notNull(), // This might be an archetype ID (uuid) or internal ID
  placeId: uuid("place_id").notNull(),
  note: text("note").notNull(),
  alternativeNote: text("alternative_note"),
  createdAt: timestamp("created_at").defaultNow(),
});
