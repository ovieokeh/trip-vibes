import { db } from "./index";
import { sql } from "drizzle-orm";
import {
  cities,
  archetypes,
  places,
  archetypesToPlaces,
  itineraries,
  vibeDescriptionsCache,
  vibeDecks,
  users,
} from "./schema";

async function reset() {
  console.log("Truncating tables...");

  const tables = [vibeDescriptionsCache, itineraries, archetypesToPlaces, places, archetypes, cities, vibeDecks, users];

  for (const table of tables) {
    // Using sql directly to ensure proper truncation with CASCADE for Postgres
    // Drizzle's delete() doesn't always support CASCADE easily in all flavors
    const tableName = (table as unknown as Record<symbol, string>)[Symbol.for("drizzle:Name")];
    console.log(`Clearing ${tableName}...`);
    await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE`));
  }

  console.log("All tables cleared.");

  // await seed(); // seeding must happen after push
}

reset()
  .catch((err) => {
    console.error("Reset failed:", err);
    process.exit(1);
  })
  .then(() => {
    console.log("Reset completed successfully.");
    process.exit(0);
  });
