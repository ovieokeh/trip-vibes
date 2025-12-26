import { db } from "./index";
import { cities, archetypes, places, archetypesToPlaces } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Start seeding ...");

  // 1. Create Cities
  const amsterdamData = {
    slug: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
  };

  const parisData = {
    slug: "paris",
    name: "Paris",
    country: "France",
  };

  // Upsert pattern with Drizzle for cities
  const existingAms = await db.select().from(cities).where(eq(cities.slug, "amsterdam")).get();
  let amsId = existingAms?.id;
  if (!existingAms) {
    const res = await db.insert(cities).values(amsterdamData).returning({ id: cities.id });
    amsId = res[0].id;
  }

  const existingPar = await db.select().from(cities).where(eq(cities.slug, "paris")).get();
  let parId = existingPar?.id;
  if (!existingPar) {
    const res = await db.insert(cities).values(parisData).returning({ id: cities.id });
    parId = res[0].id;
  }

  // 2. Create Archetypes
  const archs = await db
    .insert(archetypes)
    .values([
      {
        title: "Secret Garden",
        description: "Escape the city noise in a hidden green oasis.",
        imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80",
        category: "nature",
        searchTags: "garden,botanical,quiet,nature",
      },
      {
        title: "Industrial Decay",
        description: "Raw concrete, street art, and repurposed spaces.",
        imageUrl: "https://images.unsplash.com/photo-1641503070352-54f3ff29b253?q=80&w=1036",
        category: "culture",
        searchTags: "industrial,street art,warehouse,brutalist",
      },
      {
        title: "Local Market Hustle",
        description: "Taste the real city street food and buy useless vintage trinkets.",
        imageUrl:
          "https://res.cloudinary.com/autoura/image/upload/g_auto,c_fill,w_750,h_450/routes/xws4ijja6fhlzx7oupcs",
        category: "food",
        searchTags: "market,food,street food,bustling",
      },
      {
        title: "Dark Academia",
        description: "Old books, silence, and dust particles dancing in light beams.",
        imageUrl:
          "https://www.rijksmuseum.nl/assets/dfca0215-3725-4144-8a72-78bbba066011?w=1920&h=1080&fx=1856&fy=3167&c=a52362eb1593b509665338c55cad910b3fd434efb058b44b01e8461f7a0e30f4",
        category: "history",
        searchTags: "library,books,history,quiet",
      },
    ])
    .returning({ id: archetypes.id, title: archetypes.title });

  const archSecretGarden = archs.find((a) => a.title === "Secret Garden")!;
  const archIndustrial = archs.find((a) => a.title === "Industrial Decay")!;
  const archMarket = archs.find((a) => a.title === "Local Market Hustle")!;
  const archLibrary = archs.find((a) => a.title === "Dark Academia")!;

  // 3. Create Places
  if (amsId) {
    const placeHortus = await db
      .insert(places)
      .values({
        name: "Hortus Botanicus",
        cityId: amsId,
        lat: 52.3669,
        lng: 4.908,
        imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80",
        metadata: JSON.stringify({ openingHour: 10, closingHour: 17, duration: 90 }),
      })
      .returning({ id: places.id });

    await db.insert(archetypesToPlaces).values({
      archetypeId: archSecretGarden.id,
      placeId: placeHortus[0].id,
    });

    const placeNdsm = await db
      .insert(places)
      .values({
        name: "NDSM Wharf",
        cityId: amsId,
        lat: 52.3992,
        lng: 4.8938,
        imageUrl: "https://images.unsplash.com/photo-1641503070352-54f3ff29b253?q=80&w=1036",
        metadata: JSON.stringify({ bestTime: "afternoon", duration: 120 }),
      })
      .returning({ id: places.id });

    await db.insert(archetypesToPlaces).values({
      archetypeId: archIndustrial.id,
      placeId: placeNdsm[0].id,
    });

    const placeAlbertCuyp = await db
      .insert(places)
      .values({
        name: "Albert Cuyp Market",
        cityId: amsId,
        lat: 52.3561,
        lng: 4.8935,
        imageUrl:
          "https://res.cloudinary.com/autoura/image/upload/g_auto,c_fill,w_750,h_450/routes/xws4ijja6fhlzx7oupcs",
        metadata: JSON.stringify({ openingHour: 9, closingHour: 17, duration: 60 }),
      })
      .returning({ id: places.id });

    await db.insert(archetypesToPlaces).values({
      archetypeId: archMarket.id,
      placeId: placeAlbertCuyp[0].id,
    });

    const placeCuypers = await db
      .insert(places)
      .values({
        name: "Cuypers Library",
        cityId: amsId,
        lat: 52.36,
        lng: 4.8852,
        imageUrl:
          "https://www.rijksmuseum.nl/assets/dfca0215-3725-4144-8a72-78bbba066011?w=1920&h=1080&fx=1856&fy=3167&c=a52362eb1593b509665338c55cad910b3fd434efb058b44b01e8461f7a0e30f4",
        metadata: JSON.stringify({ openingHour: 10, closingHour: 17, duration: 45 }),
      })
      .returning({ id: places.id });

    await db.insert(archetypesToPlaces).values({
      archetypeId: archLibrary.id,
      placeId: placeCuypers[0].id,
    });
  }

  console.log("Seeding finished.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
