import { db } from "./index";
import { cities, archetypes, places, archetypesToPlaces } from "./schema";
import { eq } from "drizzle-orm";

export async function seed() {
  console.log("Start seeding ...");

  // 1. Create Cities
  const citiesData = [
    { slug: "amsterdam", name: "Amsterdam", country: "Netherlands" },
    { slug: "paris", name: "Paris", country: "France" },
    { slug: "london", name: "London", country: "United Kingdom" },
    { slug: "berlin", name: "Berlin", country: "Germany" },
    { slug: "barcelona", name: "Barcelona", country: "Spain" },
  ];

  for (const city of citiesData) {
    const existing = (await db.select().from(cities).where(eq(cities.slug, city.slug)).limit(1))[0];
    if (!existing) {
      await db.insert(cities).values(city);
    }
  }

  const ams = (await db.select().from(cities).where(eq(cities.slug, "amsterdam")).limit(1))[0];
  const amsId = ams?.id;

  // 2. Create Archetypes (15+)
  const archetypesData = [
    {
      title: "Secret Garden",
      description:
        "Hidden pockets of greenery where the city noise drops off. Expect quiet courtyards, botanical corners, and places built for slowing down.",
      imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80",
      category: "nature",
      searchTags: "garden,botanical,quiet,nature,oasis",
    },
    {
      title: "Industrial Decay",
      description:
        "Former factories and warehouses turned cultural spaces. Rough edges, street art, and a strong before-and-after story.",
      imageUrl: "https://images.unsplash.com/photo-1641503070352-54f3ff29b253?q=80&w=1036",
      category: "culture",
      searchTags: "industrial,street art,warehouse,brutalist",
    },
    {
      title: "Local Market Hustle",
      description:
        "Busy markets where food, noise, and chance discoveries collide. Come hungry and expect a little chaos.",
      imageUrl: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80",
      category: "food",
      searchTags: "market,food,street food,bustling",
    },
    {
      title: "Dark Academia",
      description:
        "Old libraries, historic halls, and places that reward silence. Ideal for wandering, reading, or pretending you’re very serious.",
      imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80",
      category: "history",
      searchTags: "library,books,history,quiet,academia",
    },
    {
      title: "Neon Noir Nights",
      description:
        "Late evenings under glowing signs and reflective streets. Think cocktail bars, night walks, and cinematic city energy.",
      imageUrl: "https://images.unsplash.com/photo-1534327994605-92db6819738d?q=80&w=800",
      category: "nightlife",
      searchTags: "neon,cyberpunk,noir,bar,cocktails",
    },
    {
      title: "Mid-Century Modern",
      description:
        "Design-forward spaces with clean lines and warm materials. Architecture tours, stylish cafés, and classic interiors.",
      imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80",
      category: "architecture",
      searchTags: "design,mid-century,furniture,minimalist",
    },
    {
      title: "Third-Wave Coffee Cult",
      description:
        "Cafés that take coffee very seriously. Expect light roasts, slow brewing, and menus that explain everything.",
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
      category: "food",
      searchTags: "coffee,brunch,roastery,minimalist",
    },
    {
      title: "Post-Socialist Brutalism",
      description:
        "Massive concrete buildings from another era. Stark, imposing, and unexpectedly fascinating once you stop to look.",
      imageUrl: "https://images.unsplash.com/photo-1688115569270-494472557502?q=80&w=800",
      category: "architecture",
      searchTags: "brutalist,concrete,soviet,monumental",
    },
    {
      title: "Secret Speakeasies",
      description:
        "Bars hidden behind unmarked doors or strange entrances. Low light, good drinks, and a small sense of discovery.",
      imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80",
      category: "nightlife",
      searchTags: "secret,speakeasy,cocktails,hidden",
    },
    {
      title: "Vinyl & High-Fidelity",
      description:
        "Listening bars and record shops built around sound quality. Sit down, tune in, and let the music do the work.",
      imageUrl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&q=80",
      category: "culture",
      searchTags: "vinyl,music,records,hifi,listening bar",
    },
    {
      title: "Kinfolk Minimalism",
      description:
        "Calm, light-filled spaces focused on simplicity. Natural materials, neutral colors, and an unspoken request to relax.",
      imageUrl: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&q=80",
      category: "nature",
      searchTags: "minimalist,kinfolk,serene,natural",
    },
    {
      title: "Cyberpunk Street Food",
      description:
        "Late-night food stalls under bright lights. Fast, flavorful meals with an unmistakably urban backdrop.",
      imageUrl: "https://images.unsplash.com/photo-1733070417830-d157dcad0fc3?q=80&w=800",
      category: "food",
      searchTags: "urban,neon,street food,asian",
    },
    {
      title: "Wabi-Sabi Tea Rooms",
      description:
        "Quiet tea spaces that value simplicity and imperfection. Slow rituals, minimal décor, and very few distractions.",
      imageUrl: "https://images.unsplash.com/photo-1674749232554-2ac15ced3954?q=80&w=800",
      category: "culture",
      searchTags: "tea,japanese,mindful,minimalist",
    },
    {
      title: "Art Deco Opulence",
      description:
        "Bold geometry, rich materials, and a hint of old-school glamour. Great for architecture walks and dramatic interiors.",
      imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      category: "architecture",
      searchTags: "art deco,luxury,glamour,interior",
    },
    {
      title: "Rave Culture Ruins",
      description:
        "Nightlife set in repurposed industrial spaces. Heavy bass, long nights, and venues that feel temporary but legendary.",
      imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
      category: "nightlife",
      searchTags: "techno,warehouse,club,berlin",
    },
    {
      title: "Nordic Noir Cosiness",
      description:
        "Moody interiors softened by warm lighting and simple comfort. Think candles, dark wood, and a calm, introspective feel.",
      imageUrl: "https://images.unsplash.com/photo-1586631411201-8f8f31c0ac16?q=80&w=800",
      category: "culture",
      searchTags: "hygge,cosy,nordic,moody",
    },
    {
      title: "Victorian Gothic",
      description:
        "Historic spaces with ornate details and a darker edge. Dramatic architecture, ironwork, and a sense of past lives.",
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
      category: "history",
      searchTags: "gothic,victorian,dramatic,historic",
    },
  ];

  for (const arch of archetypesData) {
    const existing = (await db.select().from(archetypes).where(eq(archetypes.title, arch.title)).limit(1))[0];
    if (!existing) {
      await db.insert(archetypes).values(arch);
    }
  }

  // 3. Create initial places for Amsterdam (example)
  if (amsId) {
    console.log("Seeding baseline places for Amsterdam...");
  }

  console.log("Seeding finished.");
}

if (require.main === module || !require.main) {
  seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
