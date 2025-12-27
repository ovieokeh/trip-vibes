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

    // Verify Alternative Items (should have at least one if enough candidates)
    // We have 6 slots and 6 candidates, so likely no alternatives unless some are reused or skipped?
    // Actually, selectForSlot tries to find a primary and an alternative.
    // With 6 slots and 6 candidates, we might run out of unique candidates.
    // Let's check if ANY activity has an alternative.
    // Note: In the current mock data, all candidates are unique and 1 per slot might be used.
    // To properly test alternatives, we need more candidates than slots.

    const hasAlternatives = itinerary.days.some((day) => day.activities.some((act) => act.alternative !== undefined));
    // With 6 candidates and 3 days * 6 slots = 18 slots, we surely run out of unique candidates
    // existing logic reuses candidates?
    // "const pool = candidates.filter((c) => !usedIds.has(c.id));" -> No reuse.
    // The test setup is actually "insufficient candidates" for 3 days!
    // But let's check the FIRST day.

    // Let's add more candidates to the test to ensure we can find alternatives
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
      { id: "1b", name: "Cafe B", metadata: { categories: ["Cafe"] }, lat: 10.01, lng: 10.01, cityId: "c1" }, // Close
      { id: "2a", name: "Museum A", metadata: { categories: ["Museum"] }, lat: 10, lng: 10, cityId: "c1" },
      { id: "2b", name: "Museum B", metadata: { categories: ["Museum"] }, lat: 10.05, lng: 10.05, cityId: "c1" },
      { id: "3", name: "Lunch", metadata: { categories: ["Restaurant"] }, lat: 10, lng: 10, cityId: "c1" },
      { id: "4", name: "Park", metadata: { categories: ["Park"] }, lat: 10, lng: 10, cityId: "c1" },
      { id: "5", name: "Dinner", metadata: { categories: ["Steakhouse"] }, lat: 10, lng: 10, cityId: "c1" },
      { id: "6", name: "Club", metadata: { categories: ["Nightclub"] }, lat: 10, lng: 10, cityId: "c1" },
    ] as any[];

    const itinerary = scheduler.assembleItinerary(candidates);
    const activities = itinerary.days[0].activities;

    // 1. Check Alternative
    // Breakfast slot needs "Cafe". We have 1a and 1b.
    // 1a should be primary, 1b should be alternative (or vice versa).
    const breakfast = activities.find((a) => a.startTime === "09:00");
    expect(breakfast).toBeDefined();
    expect(breakfast?.alternative).toBeDefined();
    expect(breakfast?.alternative?.category).toBe("Cafe");

    // 2. Check Transit
    // First activity has no previous location -> no transit
    expect(activities[0].transitDetails).toBeUndefined();

    // Second activity should have transit from first
    const secondActivity = activities[1];
    expect(secondActivity).toBeDefined();
    expect(secondActivity.transitDetails).toBeDefined();
    expect(secondActivity.transitDetails?.mode).toBeDefined();
  });
});
