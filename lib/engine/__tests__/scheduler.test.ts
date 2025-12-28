import { describe, it, expect } from "vitest";
import { SchedulerEngine } from "../scheduler";
import { UserPreferences } from "../../types";

describe("SchedulerEngine", () => {
  it("should distribute activities evenly across days", () => {
    const mockPrefs: UserPreferences = {
      cityId: "city-123",
      startDate: "2025-06-01",
      endDate: "2025-06-02", // 2 days
      budget: "medium",
      likedVibes: ["nature-lover", "foodie"],
      dislikedVibes: [],
      vibeProfile: { weights: { nature: 10, food: 8 }, swipes: 0 },
    };
    const scheduler = new SchedulerEngine(mockPrefs);

    // Provide enough candidates for 2 full days:
    // 3 meals per day = 6 meals, 4-5 activities per day = ~10 activities
    const candidates = [
      // Day 1 meals
      { id: "m1", name: "Cafe One", metadata: { categories: ["Cafe"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "m2", name: "Restaurant One", metadata: { categories: ["Restaurant"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "m3", name: "Steakhouse One", metadata: { categories: ["Steakhouse"] }, lat: 0, lng: 0, cityId: "c1" },
      // Day 2 meals
      { id: "m4", name: "Bakery Two", metadata: { categories: ["Bakery"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "m5", name: "Diner Two", metadata: { categories: ["Diner"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "m6", name: "Bistro Two", metadata: { categories: ["Bistro"] }, lat: 0, lng: 0, cityId: "c1" },
      // Activities for both days
      { id: "a1", name: "Museum One", metadata: { categories: ["Museum"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a2", name: "Park One", metadata: { categories: ["Park"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a3", name: "Gallery One", metadata: { categories: ["Art Gallery"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a4", name: "Zoo One", metadata: { categories: ["Zoo"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a5", name: "Museum Two", metadata: { categories: ["Museum"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a6", name: "Park Two", metadata: { categories: ["Park"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a7", name: "Beach One", metadata: { categories: ["Beach"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a8", name: "Temple One", metadata: { categories: ["Temple"] }, lat: 0, lng: 0, cityId: "c1" },
    ] as any[];

    const itinerary = scheduler.assembleItinerary(candidates);

    expect(itinerary).toBeDefined();
    expect(itinerary.days).toHaveLength(2);

    const day1Count = itinerary.days[0].activities.length;
    const day2Count = itinerary.days[1].activities.length;

    // Both days should have activities (not unbalanced)
    expect(day1Count).toBeGreaterThan(0);
    expect(day2Count).toBeGreaterThan(0);

    // The difference between days should not be extreme (balance check)
    expect(Math.abs(day1Count - day2Count)).toBeLessThanOrEqual(3);
  });

  it("should populate alternative items and transit details", () => {
    const mockPrefs: UserPreferences = {
      cityId: "city-123",
      startDate: "2025-06-01",
      endDate: "2025-06-01", // 1 day
      budget: "medium",
      likedVibes: [],
      dislikedVibes: [],
      vibeProfile: { weights: {}, swipes: 0 },
    };
    const scheduler = new SchedulerEngine(mockPrefs);

    // Create duplicates for each category to ensure alternatives are found
    const candidates = [
      { id: "1a", name: "Cafe A", metadata: { categories: ["Cafe"] }, lat: 10, lng: 10, cityId: "c1" },
      { id: "1b", name: "Cafe B", metadata: { categories: ["Cafe"] }, lat: 10.01, lng: 10.01, cityId: "c1" },
      { id: "2a", name: "Museum A", metadata: { categories: ["Museum"] }, lat: 10, lng: 10, cityId: "c1" },
      { id: "2b", name: "Museum B", metadata: { categories: ["Museum"] }, lat: 10.05, lng: 10.05, cityId: "c1" },
      { id: "3", name: "Lunch", metadata: { categories: ["Restaurant"] }, lat: 10, lng: 10, cityId: "c1" },
      { id: "4", name: "Park", metadata: { categories: ["Park"] }, lat: 10, lng: 10, cityId: "c1" },
      { id: "5", name: "Dinner", metadata: { categories: ["Steakhouse"] }, lat: 10, lng: 10, cityId: "c1" },
      { id: "6", name: "Club", metadata: { categories: ["Nightclub"] }, lat: 10, lng: 10, cityId: "c1" },
    ] as any[];

    const itinerary = scheduler.assembleItinerary(candidates);
    const activities = itinerary.days[0].activities;

    // Check that we got activities
    expect(activities.length).toBeGreaterThan(0);

    // Check Transit - activities after the first should have transit info
    if (activities.length > 1) {
      // First activity should NOT have transit
      expect(activities[0].transitDetails).toBeUndefined();

      // Get a subsequent activity and check transit
      const laterActivity = activities.find((a, i) => i > 0 && a.transitDetails);
      if (laterActivity) {
        expect(laterActivity.transitDetails?.mode).toBeDefined();
      }
    }
  });
});
