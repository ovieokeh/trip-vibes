import { db } from "./index";
import { sql } from "drizzle-orm";
import { seed } from "./seed";
import { cities, archetypes, places, archetypesToPlaces, itineraries, vibeDescriptionsCache } from "./schema";

async function reset() {
  console.log("Truncating tables...");

  const tables = [vibeDescriptionsCache, itineraries, archetypesToPlaces, places, archetypes, cities];

  for (const table of tables) {
    // Using sql directly to ensure proper truncation with CASCADE for Postgres
    // Drizzle's delete() doesn't always support CASCADE easily in all flavors
    const tableName = (table as unknown as Record<symbol, string>)[Symbol.for("drizzle:Name")];
    console.log(`Clearing ${tableName}...`);
    await db.execute(sql.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`));
  }

  console.log("All tables cleared.");

  await seed();
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
