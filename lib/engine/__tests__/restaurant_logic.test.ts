import { describe, it, expect } from "vitest";
import { SchedulerEngine } from "../scheduler";
import { UserPreferences } from "../../types";

describe("Restaurant Integration Logic", () => {
  it("should find meals at breakfast (8:00) and dinner (19:30) times", () => {
    const mockPrefs: UserPreferences = {
      cityId: "city-123",
      startDate: "2025-06-01",
      endDate: "2025-06-01",
      budget: "medium",
      likedVibes: ["nature-lover"],
      dislikedVibes: [],
      vibeProfile: { weights: { nature: 10 }, swipes: 0 },
    };
    const scheduler = new SchedulerEngine(mockPrefs);

    const candidates = [
      { id: "m1", name: "Taco Shop", metadata: { categories: ["Taco Restaurant"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "m2", name: "Sushi Place", metadata: { categories: ["Sushi Restaurant"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "m3", name: "Burger Joint", metadata: { categories: ["Burger Joint"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "m4", name: "Pizza Palace", metadata: { categories: ["Pizzeria"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "m5", name: "Cafe One", metadata: { categories: ["Cafe"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "m6", name: "Bakery Two", metadata: { categories: ["Bakery"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a1", name: "Park One", metadata: { categories: ["Park"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a2", name: "Museum Two", metadata: { categories: ["Museum"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a3", name: "Gallery Three", metadata: { categories: ["Art Gallery"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a4", name: "Plaza Four", metadata: { categories: ["Plaza"] }, lat: 0, lng: 0, cityId: "c1" },
    ] as any[];

    const itinerary = scheduler.assembleItinerary(candidates);
    const day1 = itinerary.days[0];

    const startTimes = day1.activities.map((a) => a.startTime);

    // Meals at fixed times (no lunch anymore - only breakfast and dinner)
    expect(startTimes).toContain("08:00"); // Breakfast
    expect(startTimes).toContain("19:30"); // Dinner

    // At least some activities should be scheduled in morning/afternoon windows
    const mealTimes = ["08:00", "19:30"];
    const nonMealActivities = day1.activities.filter((a) => !mealTimes.includes(a.startTime));
    expect(nonMealActivities.length).toBeGreaterThan(0);
  });

  it("should exclude pure food places from activity slots", () => {
    const mockPrefs: UserPreferences = {
      cityId: "city-123",
      startDate: "2025-06-01",
      endDate: "2025-06-01",
      budget: "medium",
      likedVibes: [],
      dislikedVibes: [],
      vibeProfile: { weights: {}, swipes: 0 },
    };
    const scheduler = new SchedulerEngine(mockPrefs);

    const candidates = [
      { id: "1", name: "Steakhouse", metadata: { categories: ["Steakhouse"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "2", name: "Park", metadata: { categories: ["Park"] }, lat: 0, lng: 0, cityId: "c1" },
    ] as any[];

    const itinerary = scheduler.assembleItinerary(candidates);
    const day1 = itinerary.days[0];

    // Get all activity slots (not meal times)
    const mealTimes = ["08:00", "19:30"];
    const activitySlotActivities = day1.activities.filter((a) => !mealTimes.includes(a.startTime));

    // Park should be in an activity slot, not Steakhouse
    const activityTitles = activitySlotActivities.map((a) => a.vibe.title);
    expect(activityTitles).toContain("Park");
    expect(activityTitles).not.toContain("Steakhouse");
  });

  it("should exclude bars/nightlife from activity slots (they count toward food limit)", () => {
    const mockPrefs: UserPreferences = {
      cityId: "city-123",
      startDate: "2025-06-01",
      endDate: "2025-06-01",
      budget: "medium",
      likedVibes: [],
      dislikedVibes: [],
      vibeProfile: { weights: {}, swipes: 0 },
    };
    const scheduler = new SchedulerEngine(mockPrefs);

    const candidates = [
      // Nightlife venues - should NOT appear in activity slots
      { id: "n1", name: "Wine Bar", metadata: { categories: ["Wine Bar"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "n2", name: "Cocktail Lounge", metadata: { categories: ["Cocktail Bar"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "n3", name: "The Pub", metadata: { categories: ["Pub"] }, lat: 0, lng: 0, cityId: "c1" },
      // Proper meal venues - for breakfast and dinner
      { id: "m1", name: "Morning Cafe", metadata: { categories: ["Cafe"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "m3", name: "Italian Restaurant", metadata: { categories: ["Restaurant"] }, lat: 0, lng: 0, cityId: "c1" },
      // Activity venues - should appear in activity slots
      { id: "a1", name: "Art Museum", metadata: { categories: ["Museum"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a2", name: "City Park", metadata: { categories: ["Park"] }, lat: 0, lng: 0, cityId: "c1" },
    ] as any[];

    const itinerary = scheduler.assembleItinerary(candidates);
    const day1 = itinerary.days[0];
    const mealTimes = ["08:00", "19:30"];
    const nightlifeNames = ["Wine Bar", "Cocktail Lounge", "The Pub"];

    // Get activity slots (non-meal times)
    const activitySlotActivities = day1.activities.filter((a) => !mealTimes.includes(a.startTime));
    const activityTitles = activitySlotActivities.map((a) => a.vibe.title);

    // NEW BEHAVIOR: Bars/nightlife should NOT be in activity slots
    // They count toward food limit and are excluded from isActivity()
    for (const name of nightlifeNames) {
      expect(activityTitles).not.toContain(name);
    }

    // Real activities (Museum, Park) SHOULD be in activity slots
    expect(activityTitles.some((t) => t.includes("Museum") || t.includes("Park"))).toBe(true);
  });
});
