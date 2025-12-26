import { Vibe, Itinerary, DayPlan, DayActivity, UserPreferences } from "./types";
import { VIBES } from "./data";
import { v4 as uuidv4 } from "uuid"; // We might need uuid, or just use random strings. I'll use Math.random for MVS to avoid deps.

function generateId() {
  return uuidv4();
}

export function generateItinerary(prefs: UserPreferences): Itinerary {
  // 1. Get Liked Vibes with full data
  const likedVibeData = VIBES.filter((v) => prefs.likedVibes.includes(v.id));

  // 2. Simple fallback if few likes: Add top rated from city (first 3)
  let candidates = [...likedVibeData];
  if (candidates.length < 3) {
    const extra = VIBES.filter(
      (v) => v.cityId === prefs.cityId && !prefs.likedVibes.includes(v.id) && !prefs.dislikedVibes.includes(v.id)
    ).slice(0, 3 - candidates.length);
    candidates = [...candidates, ...extra];
  }

  // 3. Calculate Days
  const start = new Date(prefs.startDate || new Date().toISOString());
  const end = new Date(prefs.endDate || new Date().toISOString());
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const totalDays = Math.max(1, Math.min(diffDays, 7)); // clamp 1-7 days for MVS

  const days: DayPlan[] = [];

  // 4. Distribute candidates across days
  // Very simple logic: 2-3 activities per day
  // Try to group by neighborhood?

  // Sort candidates by neighborhood to cluster them
  candidates.sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));

  let candidateIdx = 0;

  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);

    const activities: DayActivity[] = [];

    // Morning (if available)
    if (candidateIdx < candidates.length) {
      activities.push({
        id: generateId(),
        vibe: candidates[candidateIdx],
        startTime: "10:00",
        endTime: "12:00",
        note: "Start your day here.",
        isAlternative: false,
      });
      candidateIdx++;
    }

    // Lunch gap?

    // Afternoon
    if (candidateIdx < candidates.length) {
      activities.push({
        id: generateId(),
        vibe: candidates[candidateIdx],
        startTime: "14:00",
        endTime: "16:00",
        note: "Afternoon exploration.",
        isAlternative: false,
      });
      candidateIdx++;
    }

    // Evening (if nightlife or dinner)
    // Check if we have a nightlife vibe left or just pick next
    if (candidateIdx < candidates.length) {
      // Optional evening slot
      activities.push({
        id: generateId(),
        vibe: candidates[candidateIdx],
        startTime: "19:00",
        endTime: "21:00",
        note: "Perfect way to end the day.",
        isAlternative: false,
      });
      candidateIdx++;
    }

    days.push({
      dayNumber: i + 1,
      date: currentDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      activities,
    });
  }

  return {
    id: generateId(),
    cityId: prefs.cityId,
    days,
    createdAt: new Date().toISOString(),
  };
}
