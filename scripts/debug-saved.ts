import { db } from "@/lib/db";
import { itineraries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    const all = await db.select().from(itineraries);
    console.log("Total itineraries:", all.length);
    const saved = await db.select().from(itineraries).where(eq(itineraries.isSaved, true));
    console.log("Saved itineraries:", saved.length);
    if (saved.length > 0) {
      console.log("First saved:", JSON.stringify(saved[0], null, 2));
    } else {
      console.log("No saved itineraries found.");
    }
  } catch (error) {
    console.error("Error querying DB:", error);
  }
}

main();
