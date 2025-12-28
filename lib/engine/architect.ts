import OpenAI from "openai";
import { db } from "../db";
import { vibeDescriptionsCache, itineraries } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { Itinerary, UserPreferences } from "../types";
import crypto from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

export async function getVibeDescription(
  vibeId: string,
  placeId: string,
  placeName: string,
  vibeTitle: string,
  locale: string = "en"
) {
  // 1. Check Cache
  const cached = (
    await db
      .select()
      .from(vibeDescriptionsCache)
      .where(
        and(
          eq(vibeDescriptionsCache.vibeId, vibeId),
          eq(vibeDescriptionsCache.placeId, placeId),
          eq(vibeDescriptionsCache.locale, locale)
        )
      )
      .limit(1)
  )[0];

  if (cached) return cached;

  // Map locale to common name for LLM if needed, though ISO codes often work well.
  const languageNames: Record<string, string> = {
    en: "English",
    el: "Greek",
    nl: "Dutch",
    es: "Spanish",
    de: "German",
  };
  const targetLanguage = languageNames[locale] || "English";

  // 2. Generate with OpenAI
  const prompt = `You are a travel 'vibe' architect. 
  A user liked the vibe: "${vibeTitle}".
  I have found a place called: "${placeName}".
  
  Write a short, punchy 'vibe note' (max 20 words) explaining why this place matches that vibe. 
  Also suggest a 'vibe alternative' (max 10 words) if they want something similar nearby.
  
  CRITICAL: You MUST write your response in ${targetLanguage}.
  
  Format as JSON: { "note": "...", "alternative": "..." }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // 3. Save to Cache
    const newEntry = {
      vibeId,
      placeId,
      locale,
      note: result.note || "A perfect match for your vibe.",
      alternativeNote: result.alternative || "Check out nearby spots.",
    };

    const inserted = (await db.insert(vibeDescriptionsCache).values(newEntry).returning())[0];
    return inserted;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return {
      note:
        locale === "el"
          ? "Ένα τοπικό διαμάντι που ταιριάζει στις προτιμήσεις σας."
          : "A local gem matching your preferences.",
      alternativeNote: locale === "el" ? "Εξερευνήστε τη γύρω περιοχή." : "Explore the vicinity.",
      locale,
    };
  }
}

export async function cacheItinerary(cityId: string, prefs: UserPreferences, itinerary: Itinerary) {
  const prefsHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        likedVibes: prefs.likedVibes,
        budget: prefs.budget,
        days: new Date(prefs.endDate).getTime() - new Date(prefs.startDate).getTime(),
      })
    )
    .digest("hex");

  await db.insert(itineraries).values({
    id: itinerary.id,
    cityId,
    preferencesHash: prefsHash,
    data: JSON.stringify(itinerary),
    startDate: prefs.startDate,
    endDate: prefs.endDate,
  });
}

export async function getCachedItinerary(cityId: string, prefs: UserPreferences) {
  // If forceRefresh is requested, skip cache lookup entirely
  if (prefs.forceRefresh) {
    console.log(`[Architect] Force refresh requested, skipping itinerary cache`);
    return undefined;
  }

  const prefsHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        likedVibes: prefs.likedVibes,
        budget: prefs.budget,
        days: new Date(prefs.endDate).getTime() - new Date(prefs.startDate).getTime(),
      })
    )
    .digest("hex");

  return (
    await db
      .select()
      .from(itineraries)
      .where(and(eq(itineraries.cityId, cityId), eq(itineraries.preferencesHash, prefsHash)))
      .limit(1)
  )[0];
}
