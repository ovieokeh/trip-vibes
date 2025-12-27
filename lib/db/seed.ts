import { db } from "./index";
import { archetypes } from "./schema";
import { eq } from "drizzle-orm";
import { ARCHETYPES } from "../archetypes";

export async function seed() {
  console.log("Start seeding ...");

  // 2. Create Archetypes from lib/archetypes.ts
  for (const arch of ARCHETYPES) {
    const existing = (await db.select().from(archetypes).where(eq(archetypes.title, arch.title)).limit(1))[0];
    if (!existing) {
      // Need to flatten tags to string
      await db.insert(archetypes).values({
        id: arch.id, // Using the fixed ID from definition
        title: arch.title,
        description: arch.description,
        imageUrl: arch.imageUrl, // This might need a real URL update if it's just keywords
        category: arch.category.toLowerCase(),
        searchTags: arch.tags.join(","),
      });
    }
  }

  console.log("Seeding finished.");
}

if (require.main === module || !require.main) {
  seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
