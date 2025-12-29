CREATE TABLE "archetypes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"category" text NOT NULL,
	"search_tags" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "archetypes_to_places" (
	"archetype_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	CONSTRAINT "archetypes_to_places_archetype_id_place_id_pk" PRIMARY KEY("archetype_id","place_id")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "cities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "itineraries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid NOT NULL,
	"preferences_hash" text NOT NULL,
	"data" text NOT NULL,
	"is_saved" boolean DEFAULT false,
	"name" text,
	"start_date" text,
	"end_date" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"foursquare_id" text,
	"google_places_id" text,
	"name" text NOT NULL,
	"address" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"image_url" text,
	"rating" double precision,
	"price_level" integer DEFAULT 1,
	"website" text,
	"phone" text,
	"opening_hours" text,
	"photo_urls" text,
	"city_id" uuid NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vibe_descriptions_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vibe_id" text NOT NULL,
	"place_id" uuid NOT NULL,
	"note" text NOT NULL,
	"alternative_note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "archetypes_to_places" ADD CONSTRAINT "archetypes_to_places_archetype_id_archetypes_id_fk" FOREIGN KEY ("archetype_id") REFERENCES "public"."archetypes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archetypes_to_places" ADD CONSTRAINT "archetypes_to_places_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;