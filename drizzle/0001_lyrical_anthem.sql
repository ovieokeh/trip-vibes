CREATE TABLE "vibe_decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"liked_vibes" text NOT NULL,
	"vibe_profile" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "archetypes" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "archetypes" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "archetypes_to_places" ALTER COLUMN "archetype_id" SET DATA TYPE text;