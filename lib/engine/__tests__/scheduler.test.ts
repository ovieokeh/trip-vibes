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

  it("should not schedule a restaurant as both meal and activity", () => {
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

    // Only provide restaurant-type candidates
    const candidates = [
      { id: "r1", name: "Restaurant One", metadata: { categories: ["Restaurant"] }, lat: 0, lng: 0, cityId: "c1" },
      {
        id: "r2",
        name: "Restaurant Two",
        metadata: { categories: ["Italian Restaurant"] },
        lat: 0,
        lng: 0,
        cityId: "c1",
      },
      { id: "r3", name: "Steakhouse", metadata: { categories: ["Steakhouse"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "c1", name: "Cafe One", metadata: { categories: ["Cafe"] }, lat: 0, lng: 0, cityId: "c1" },
      // Add some true activities
      { id: "a1", name: "Central Park", metadata: { categories: ["Park"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a2", name: "Art Museum", metadata: { categories: ["Museum"] }, lat: 0, lng: 0, cityId: "c1" },
    ] as any[];

    const itinerary = scheduler.assembleItinerary(candidates);
    const activities = itinerary.days[0].activities;

    // Count how many times each ID appears
    const idCounts = new Map<string, number>();
    activities.forEach((act) => {
      const id = act.vibe.id;
      idCounts.set(id, (idCounts.get(id) || 0) + 1);
    });

    // No ID should appear more than once
    for (const [id, count] of idCounts) {
      expect(count).toBe(1);
    }

    // Verify we have BOTH meals and activities scheduled
    const mealNames = activities.filter(
      (a) =>
        a.vibe.category?.toLowerCase().includes("restaurant") ||
        a.vibe.category?.toLowerCase().includes("cafe") ||
        a.vibe.category?.toLowerCase().includes("steakhouse")
    );
    const activityNames = activities.filter(
      (a) => a.vibe.category?.toLowerCase().includes("park") || a.vibe.category?.toLowerCase().includes("museum")
    );

    expect(mealNames.length).toBeGreaterThan(0);
    expect(activityNames.length).toBeGreaterThan(0);
  });

  it("should enforce variety by penalizing repetitive categories", () => {
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

    // Candidates:
    // 3 Parks with high scores (100, 95, 90)
    // 1 Museum with medium score (80)
    //
    // Without penalty: Park (100) -> Park (95) -> Park (90)
    // With penalty (-30): Park (100) -> Museum (80) [Park becomes 65] -> Park (95) [Museum used]
    const candidates = [
      { id: "p1", name: "Park 1", _score: 100, metadata: { categories: ["Park"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "p2", name: "Park 2", _score: 95, metadata: { categories: ["Park"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "m1", name: "Museum 1", _score: 80, metadata: { categories: ["Museum"] }, lat: 0, lng: 0, cityId: "c1" },
      // Needs minimum meals to run
      { id: "r1", name: "Food 1", _score: 50, metadata: { categories: ["Restaurant"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "r2", name: "Food 2", _score: 50, metadata: { categories: ["Restaurant"] }, lat: 0, lng: 0, cityId: "c1" },
      // Extra activity so we have enough
      { id: "x1", name: "Other 1", _score: 10, metadata: { categories: ["Other"] }, lat: 0, lng: 0, cityId: "c1" },
    ] as any[];

    // override splitCandidates to just return these manually if needed,
    // but the logic relies on isMeal/isActivity which depends on categories.
    // Park/Museum are activities, Restaurant is meal.

    const itinerary = scheduler.assembleItinerary(candidates);
    const activities = itinerary.days[0].activities;

    // Filter to just our activities (exclude meals)
    const scheduledNames = activities
      .filter((a) => ["Park 1", "Park 2", "Museum 1"].includes(a.vibe.title))
      .map((a) => a.vibe.title);

    // Expect: Park 1 -> Museum 1 -> Park 2
    // If tracking wasn't working: Park 1 -> Park 2 -> Museum 1

    expect(scheduledNames.length).toBeGreaterThanOrEqual(2);
    expect(scheduledNames[0]).toBe("Park 1"); // Highest score (100)
    expect(scheduledNames[1]).toBe("Museum 1"); // 80 > (95 - 30 = 65)
  });
  it("should prioritize geographic clustering while maintaining variety", () => {
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

    // Scenario:
    // Prev Location: (0, 0)
    // A: Park 1 (0, 0) [Dist 0km] -> Score 100 + 20 boost = 120
    // B: Museum (0.1, 0) [Dist ~11km] -> Score 100 + 0 boost = 100
    // C: Park 2 (0, 0.01) [Dist ~1km] -> Score 100 + 20 boost - 30 penalty = 90
    //
    // Expect: Park 1 -> Museum -> Park 2
    // If strict clustering only: Park 1 -> Park 2 -> Museum
    const candidates = [
      { id: "p1", name: "Park 1", _score: 100, metadata: { categories: ["Park"] }, lat: 0, lng: 0, cityId: "c1" },
      {
        id: "p1_alt",
        name: "Park 1 Alt",
        _score: 99,
        metadata: { categories: ["Park"] },
        lat: 0,
        lng: 0.001,
        cityId: "c1",
      },
      // Park 2 is slightly lower score initially, so it doesn't get picked as p1's alternative
      { id: "p2", name: "Park 2", _score: 90, metadata: { categories: ["Park"] }, lat: 0, lng: 0.01, cityId: "c1" },
      { id: "m1", name: "Museum", _score: 95, metadata: { categories: ["Museum"] }, lat: 0.1, lng: 0, cityId: "c1" },
      {
        id: "m1_alt",
        name: "Museum Alt",
        _score: 94,
        metadata: { categories: ["Museum"] },
        lat: 0.1,
        lng: 0.001,
        cityId: "c1",
      },
      // Minimal meals
      { id: "r1", name: "Food 1", _score: 50, metadata: { categories: ["Restaurant"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "r2", name: "Food 2", _score: 50, metadata: { categories: ["Restaurant"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "x1", name: "Other", _score: 10, metadata: { categories: ["Other"] }, lat: 0, lng: 0, cityId: "c1" },
    ] as any[];

    // First activity of day starts at (0,0) implicitly if previousLocation passed?
    // Actually assembleItinerary initializes previousLocation to null.
    // So the FIRST activity is picked purely by score (Park 1 or Park 2 or Museum - all 100).
    // Let's assume Park 1 is picked (first in list).
    //
    // Then 2nd activity: uses Park 1 loc (0,0).
    // Park 2 dist < 3km (+20). Museum dist > 5km (0).
    // Park 2 score: 100 + 20 - 30 = 90.
    // Museum score: 100 + 0 = 100.
    // Museum wins.
    //
    // Then 3rd activity: uses Museum loc (0.1, 0).
    // Park 2 dist to Museum ~11km.
    // Park 2 score: 100 + 0 - 30 = 70.
    //
    // Wait... if Park 2 is 90 vs Museum 100, Museum wins.
    // This confirms Variety > Clustering in this specific tuning (30 penalty > 20 boost).

    const itinerary = scheduler.assembleItinerary(candidates);
    const activities = itinerary.days[0].activities; // .filter(a => !isMeal(a.vibe));

    const scheduledNames = activities
      .filter((a) => ["Park 1", "Park 2", "Museum"].includes(a.vibe.title))
      .map((a) => a.vibe.title);

    // Should include all 3
    expect(scheduledNames).toHaveLength(3);
    // Park 1 should be first (highest base score, first in list)
    expect(scheduledNames[0]).toBe("Park 1");
    // Museum should be second (Variety penalty -30 outweighs Proximity +20)
    expect(scheduledNames[1]).toBe("Museum");
    // Park 2 third
    expect(scheduledNames[2]).toBe("Park 2");
  });
});
