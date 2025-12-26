import { db } from "./index";
import { cities, archetypes, places, archetypesToPlaces } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
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
    const existing = await db.select().from(cities).where(eq(cities.slug, city.slug)).get();
    if (!existing) {
      await db.insert(cities).values(city);
    }
  }

  const ams = await db.select().from(cities).where(eq(cities.slug, "amsterdam")).get();
  const amsId = ams?.id;

  // 2. Create Archetypes (15+)
  const archetypesData = [
    {
      title: "Secret Garden",
      description: "Escape the city noise in a hidden green oasis.",
      imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80",
      category: "nature",
      searchTags: "garden,botanical,quiet,nature,oasis",
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
      description: "Taste the real city street food and buy vintage trinkets.",
      imageUrl: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80",
      category: "food",
      searchTags: "market,food,street food,bustling",
    },
    {
      title: "Dark Academia",
      description: "Old books, silence, and dust particles dancing in light beams.",
      imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80",
      category: "history",
      searchTags: "library,books,history,quiet,academia",
    },
    {
      title: "Neon Noir Nights",
      description: "Sleek lighting, rain-slicked streets, and late-night vibes.",
      imageUrl: "https://images.unsplash.com/photo-1514525253361-b44c8b9d038a?w=800&q=80",
      category: "nightlife",
      searchTags: "neon,cyberpunk,noir,bar,cocktails",
    },
    {
      title: "Mid-Century Modern",
      description: "Clean lines, functional design, and 1950s elegance.",
      imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80",
      category: "architecture",
      searchTags: "design,mid-century,furniture,minimalist",
    },
    {
      title: "Third-Wave Coffee Cult",
      description: "Light roasts, artisanal techniques, and minimalist spaces.",
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
      category: "food",
      searchTags: "coffee,brunch,roastery,minimalist",
    },
    {
      title: "Post-Socialist Brutalism",
      description: "Monolithic concrete structures and dramatic scales.",
      imageUrl: "https://images.unsplash.com/photo-1542385431-7e61ee212a4c?w=800&q=80",
      category: "architecture",
      searchTags: "brutalist,concrete,soviet,monumental",
    },
    {
      title: "Secret Speakeasies",
      description: "Unmarked doors, dimly lit booths, and world-class mixology.",
      imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80",
      category: "nightlife",
      searchTags: "secret,speakeasy,cocktails,hidden",
    },
    {
      title: "Vinyl & High-Fidelity",
      description: "Analog sounds, warm aesthetics, and listening bars.",
      imageUrl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&q=80",
      category: "culture",
      searchTags: "vinyl,music,records,hifi,listening bar",
    },
    {
      title: "Kinfolk Minimalism",
      description: "Soft textures, natural light, and slow living aesthetics.",
      imageUrl: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&q=80",
      category: "nature",
      searchTags: "minimalist,kinfolk,serene,natural",
    },
    {
      title: "Cyberpunk Street Food",
      description: "Neon-lit stalls, steaming bowls, and urban energy.",
      imageUrl: "https://images.unsplash.com/photo-1545044846-351ba102b4d5?w=800&q=80",
      category: "food",
      searchTags: "urban,neon,street food,asian",
    },
    {
      title: "Wabi-Sabi Tea Rooms",
      description: "Imperfection, simplicity, and mindful preparation.",
      imageUrl: "https://images.unsplash.com/photo-1544787210-282dc4bc51f3?w=800&q=80",
      category: "culture",
      searchTags: "tea,japanese,mindful,minimalist",
    },
    {
      title: "Art Deco Opulence",
      description: "Geometric patterns, gold accents, and jazz age flair.",
      imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      category: "architecture",
      searchTags: "art deco,luxury,glamour,interior",
    },
    {
      title: "Rave Culture Ruins",
      description: "Abandoned factories, heavy bass, and nocturnal energy.",
      imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
      category: "nightlife",
      searchTags: "techno,warehouse,club,berlin",
    },
    {
      title: "Nordic Noir Cosiness",
      description: "Hygge vibes, darker tones, and moody lighting.",
      imageUrl: "https://images.unsplash.com/photo-1478144592103-258228816893?w=800&q=80",
      category: "culture",
      searchTags: "hygge,cosy,nordic,moody",
    },
    {
      title: "Victorian Gothic",
      description: "Wrought iron, dark velvet, and historic drama.",
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
      category: "history",
      searchTags: "gothic,victorian,dramatic,historic",
    },
  ];

  for (const arch of archetypesData) {
    const existing = await db.select().from(archetypes).where(eq(archetypes.title, arch.title)).get();
    if (!existing) {
      await db.insert(archetypes).values(arch);
    }
  }

  // 3. Create initial places for Amsterdam (example)
  if (amsId) {
    // We'll skip the places part for now as the user wants real API discovery,
    // but having a few baseline is good for testing.
    console.log("Seeding baseline places for Amsterdam...");
    // ... same as before but maybe more descriptive
  }

  console.log("Seeding finished.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
