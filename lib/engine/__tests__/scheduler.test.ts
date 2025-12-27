import { describe, it, expect } from "vitest";
import { SchedulerEngine } from "../scheduler";
import { UserPreferences } from "../../types";

describe("SchedulerEngine", () => {
  it("should respect the daily template structure", () => {
    const mockPrefs: UserPreferences = {
      cityId: "city-123",
      startDate: "2025-06-01",
      endDate: "2025-06-03", // 3 days
      budget: "medium",
      likedVibes: ["nature-lover", "foodie"],
      dislikedVibes: [],
      vibeProfile: { weights: { nature: 10, food: 8 }, swipes: 0 },
    };
    const scheduler = new SchedulerEngine(mockPrefs);

    const candidates = [
      {
        id: "1",
        name: "Morning Cafe",
        metadata: { categories: ["Cafe"] },
        openingHours: null,
        rating: 5,
        lat: 0,
        lng: 0,
        cityId: "c1",
      },
      {
        id: "2",
        name: "Art Museum",
        metadata: { categories: ["Museum"] },
        openingHours: null,
        rating: 5,
        lat: 0,
        lng: 0,
        cityId: "c1",
      },
      {
        id: "3",
        name: "Lunch Spot",
        metadata: { categories: ["Restaurant"] },
        openingHours: null,
        rating: 5,
        lat: 0,
        lng: 0,
        cityId: "c1",
      },
      {
        id: "4",
        name: "Afternoon Park",
        metadata: { categories: ["Park"] },
        openingHours: null,
        rating: 5,
        lat: 0,
        lng: 0,
        cityId: "c1",
      },
      {
        id: "5",
        name: "Dinner Steakhouse",
        metadata: { categories: ["Steakhouse"] },
        openingHours: null,
        rating: 5,
        lat: 0,
        lng: 0,
        cityId: "c1",
      },
      {
        id: "6",
        name: "Night Club",
        metadata: { categories: ["Nightclub"] },
        openingHours: null,
        rating: 5,
        lat: 0,
        lng: 0,
        cityId: "c1",
      },
    ] as any[];

    const itinerary = scheduler.assembleItinerary(candidates);

    expect(itinerary).toBeDefined();
    expect(itinerary.days).toHaveLength(3);

    const day1 = itinerary.days[0];
    expect(day1.activities.length).toBeGreaterThan(0);

    // Verify Start Times match template
    const startTimes = day1.activities.map((a) => a.startTime);
    expect(startTimes).toContain("09:00"); // Breakfast
    expect(startTimes).toContain("13:00"); // Lunch
    expect(startTimes).toContain("19:30"); // Dinner
  });
});
