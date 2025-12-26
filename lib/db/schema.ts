import { sqliteTable, text, real, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const cities = sqliteTable("cities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const archetypes = sqliteTable("archetypes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  searchTags: text("search_tags").notNull(), // Comma-separated tags
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const places = sqliteTable("places", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  externalId: text("external_id"),
  name: text("name").notNull(),
  address: text("address"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  imageUrl: text("image_url"),
  rating: real("rating"),
  priceLevel: integer("price_level").default(1),
  cityId: text("city_id")
    .notNull()
    .references(() => cities.id),
  metadata: text("metadata"), // JSON stringified blob
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const archetypesToPlaces = sqliteTable(
  "archetypes_to_places",
  {
    archetypeId: text("archetype_id")
      .notNull()
      .references(() => archetypes.id),
    placeId: text("place_id")
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
