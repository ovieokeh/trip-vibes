import { db } from "@/lib/db";
import { itineraries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    const all = await db.select().from(itineraries).all();
    if (all.length > 0) {
      const id = all[0].id;
      console.log(`Updating itinerary ${id} to isSaved=true`);
      await db.update(itineraries).set({ isSaved: true }).where(eq(itineraries.id, id));

      const saved = await db.select().from(itineraries).where(eq(itineraries.isSaved, true)).all();
      console.log("Saved itineraries after update:", saved.length);
    } else {
      console.log("No itineraries to update.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
