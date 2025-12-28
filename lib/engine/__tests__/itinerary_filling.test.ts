import { describe, it, expect } from "vitest";
import { SchedulerEngine } from "../scheduler";
import { UserPreferences, EngineCandidate } from "../../types";

// Mock Data with ENOUGH activities for multi-day filling
const mockPrefs: UserPreferences = {
  cityId: "amsterdam",
  startDate: "2025-01-16",
  endDate: "2025-01-17", // 2 days
  budget: "medium",
  likedVibes: [],
  dislikedVibes: [],
  vibeProfile: { weights: {}, swipes: 0 },
};

// Helper to create activity candidates
const createActivity = (id: string, name: string, lat: number, lng: number): EngineCandidate => ({
  id,
  foursquareId: `fsq-${id}`,
  googlePlacesId: null,
  name,
  cityId: "amsterdam",
  lat,
  lng,
  address: `${name} Address`,
  rating: 8.0,
  website: null,
  phone: null,
  imageUrl: `https://example.com/${id}.jpg`,
  metadata: {
    categories: ["Museum"],
    categoryId: "4d4b7104d754a06370d81259", // Arts root
    source: "fsq",
    website: null,
    phone: null,
  },
  photos: [],
  _score: 80,
});

// Helper to create meal candidates
const createMeal = (id: string, name: string, lat: number, lng: number, categories: string[]): EngineCandidate => ({
  id,
  foursquareId: `fsq-${id}`,
  googlePlacesId: null,
  name,
  cityId: "amsterdam",
  lat,
  lng,
  address: `${name} Address`,
  rating: 8.0,
  website: null,
  phone: null,
  imageUrl: `https://example.com/${id}.jpg`,
  metadata: {
    categories,
    categoryId: "63be6904847c3692a84b9bb5", // Dining root
    source: "fsq",
    website: null,
    phone: null,
  },
  photos: [],
  _score: 80,
});

describe("Itinerary Filling", () => {
  describe("Time-Based Gap Filling", () => {
    it("should fill entire 10h gap with multiple activities", async () => {
      // 12 activities = enough for 2 days × 5-6 activities each
      const mockCandidates: EngineCandidate[] = [
        // Meals (4 total: 2 breakfasts + 2 dinners)
        createMeal("m1", "Morning Cafe 1", 52.37, 4.89, ["Cafe", "Breakfast"]),
        createMeal("m2", "Morning Cafe 2", 52.37, 4.9, ["Cafe", "Breakfast"]),
        createMeal("m3", "Dinner Restaurant 1", 52.36, 4.89, ["Restaurant"]),
        createMeal("m4", "Dinner Restaurant 2", 52.36, 4.9, ["Restaurant"]),
        // Activities (10 total)
        createActivity("a1", "Rijksmuseum", 52.36, 4.88),
        createActivity("a2", "Van Gogh Museum", 52.358, 4.881),
        createActivity("a3", "Anne Frank House", 52.375, 4.884),
        createActivity("a4", "Vondelpark", 52.358, 4.868),
        createActivity("a5", "Dam Square", 52.373, 4.893),
        createActivity("a6", "Royal Palace", 52.373, 4.891),
        createActivity("a7", "Jordaan District", 52.376, 4.881),
        createActivity("a8", "Canal Ring", 52.37, 4.885),
        createActivity("a9", "NEMO Science", 52.374, 4.912),
        createActivity("a10", "Artis Zoo", 52.366, 4.916),
      ];

      const engine = new SchedulerEngine(mockPrefs);
      const itinerary = await engine.assembleItinerary(mockCandidates);

      expect(itinerary.days.length).toBe(2);

      // Day 1 should have breakfast + multiple activities + dinner
      const day1 = itinerary.days[0];
      console.log(
        "Day 1:",
        day1.activities.map((a) => `${a.startTime} - ${a.vibe.title}`)
      );

      // Breakfast at 8:00, Dinner at 19:30
      const breakfast1 = day1.activities.find((a) => a.startTime === "08:00");
      const dinner1 = day1.activities.find((a) => a.startTime === "19:30");
      expect(breakfast1).toBeDefined();
      expect(dinner1).toBeDefined();

      // Should have at least 4 activities (between 09:00 and 19:30)
      const activities1 = day1.activities.filter((a) => a.startTime !== "08:00" && a.startTime !== "19:30");
      expect(activities1.length).toBeGreaterThanOrEqual(4);

      // Day 2 should also have breakfast + activities + dinner
      const day2 = itinerary.days[1];
      console.log(
        "Day 2:",
        day2.activities.map((a) => `${a.startTime} - ${a.vibe.title}`)
      );

      const breakfast2 = day2.activities.find((a) => a.startTime === "08:00");
      const dinner2 = day2.activities.find((a) => a.startTime === "19:30");
      expect(breakfast2).toBeDefined();
      expect(dinner2).toBeDefined();

      // Day 2 should also have at least 3 activities (remaining candidates)
      const activities2 = day2.activities.filter((a) => a.startTime !== "08:00" && a.startTime !== "19:30");
      expect(activities2.length).toBeGreaterThanOrEqual(3);
    });

    it("should stop filling when no candidates remain", async () => {
      // Only 2 activities for 2 days
      const sparseData: EngineCandidate[] = [
        createMeal("m1", "Cafe 1", 52.37, 4.89, ["Cafe"]),
        createMeal("m2", "Cafe 2", 52.37, 4.9, ["Cafe"]),
        createMeal("m3", "Restaurant 1", 52.36, 4.89, ["Restaurant"]),
        createMeal("m4", "Restaurant 2", 52.36, 4.9, ["Restaurant"]),
        createActivity("a1", "Museum 1", 52.36, 4.88),
        createActivity("a2", "Museum 2", 52.358, 4.881),
      ];

      const engine = new SchedulerEngine(mockPrefs);
      const itinerary = await engine.assembleItinerary(sparseData);

      // Should still work gracefully
      expect(itinerary.days.length).toBe(2);

      // Day 1 gets both activities (time-based, no budget limit)
      const day1Activities = itinerary.days[0].activities.filter(
        (a) => a.startTime !== "08:00" && a.startTime !== "19:30"
      );
      expect(day1Activities.length).toBe(2);

      // Day 2 has no remaining activities (pool exhausted)
      const day2Activities = itinerary.days[1].activities.filter(
        (a) => a.startTime !== "08:00" && a.startTime !== "19:30"
      );
      expect(day2Activities.length).toBe(0);
    });

    it("should respect activity duration when filling gaps", async () => {
      const candidates: EngineCandidate[] = [
        createMeal("m1", "Cafe", 52.37, 4.89, ["Cafe"]),
        createMeal("m2", "Restaurant", 52.36, 4.89, ["Restaurant"]),
        createActivity("a1", "Museum", 52.36, 4.88),
        createActivity("a2", "Park", 52.358, 4.881),
        createActivity("a3", "Monument", 52.375, 4.884),
        createActivity("a4", "Plaza", 52.358, 4.868),
        createActivity("a5", "Gallery", 52.373, 4.893),
      ];

      const singleDayPrefs = { ...mockPrefs, endDate: "2025-01-16" }; // 1 day
      const engine = new SchedulerEngine(singleDayPrefs);
      const itinerary = await engine.assembleItinerary(candidates);

      const day = itinerary.days[0];
      console.log(
        "Single day:",
        day.activities.map((a) => `${a.startTime}-${a.endTime} ${a.vibe.title}`)
      );

      // Activities should be scheduled in chronological order
      for (let i = 1; i < day.activities.length; i++) {
        const prev = day.activities[i - 1];
        const curr = day.activities[i];
        // Each activity should start after or at the previous one's end time
        expect(curr.startTime >= prev.endTime).toBe(true);
      }
    });
  });
});
