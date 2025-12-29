ALTER TABLE "cities" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "vibe_descriptions_cache" ADD COLUMN "locale" text DEFAULT 'en' NOT NULL;