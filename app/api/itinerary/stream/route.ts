import { NextRequest, NextResponse } from "next/server";
import { MatchingEngine } from "@/lib/engine/engine";
import { UserPreferences } from "@/lib/types";
import { cacheItinerary, getCachedItinerary, getVibeDescription } from "@/lib/engine/architect";
import { db } from "@/lib/db";
import { archetypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prefsStr = searchParams.get("prefs");

  if (!prefsStr) {
    return NextResponse.json({ error: "Missing prefs" }, { status: 400 });
  }

  const prefs = JSON.parse(decodeURIComponent(prefsStr)) as UserPreferences;

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // 1. Check Cache
        sendEvent({ type: "progress", key: "checking_cache", step: "init" });
        const cached = await getCachedItinerary(prefs.cityId, prefs);
        if (cached) {
          sendEvent({ type: "progress", key: "found_cached", step: "done" });
          sendEvent({ type: "result", data: JSON.parse(cached.data) });
          controller.close();
          return;
        }

        // 2. Run Engine with Progress
        const engine = new MatchingEngine(prefs, (key, params) => {
          sendEvent({ type: "progress", key, params, step: "engine" });
        });

        const itinerary = await engine.generate();

        // 3. Enrich with AI Descriptive Layer
        sendEvent({ type: "progress", key: "crafting_descriptions", step: "enrich" });

        let actCount = 0;
        const totalActivities = itinerary.days.reduce((acc, d) => acc + d.activities.length, 0);

        for (const day of itinerary.days) {
          for (const activity of day.activities) {
            actCount++;
            if (actCount % 2 === 0 || actCount === 1) {
              sendEvent({
                type: "progress",
                key: "personalizing_activity",
                params: { current: actCount, total: totalActivities },
                step: "enrich",
              });
            }

            // Find the vibe that matched this place
            const matchedVibeId = prefs.likedVibes[0];
            const vibe = (await db.select().from(archetypes).where(eq(archetypes.id, matchedVibeId)).limit(1))[0];

            const vibeDesc = await getVibeDescription(
              matchedVibeId,
              activity.vibe.id,
              activity.vibe.title,
              vibe?.title || "Great vibe"
            );

            activity.note = vibeDesc.note;
          }
        }

        // 4. Cache full itinerary
        sendEvent({ type: "progress", key: "finalizing", step: "finalize" });
        await cacheItinerary(prefs.cityId, prefs, itinerary);

        sendEvent({ type: "result", data: itinerary });
        controller.close();
      } catch (error) {
        const err = error as Error;
        console.error("Stream error:", err);
        sendEvent({ type: "error", key: "generic_error", message: err.message });
        controller.close(); // Finish stream even on error so client disconnects
      }
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
