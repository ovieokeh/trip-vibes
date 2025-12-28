import { describe, it, expect } from "vitest";
import { SchedulerEngine } from "../scheduler";
import { calculateTransit } from "../../activity";
import { UserPreferences } from "../../types";

describe("Reproduction: Itinerary Issues", () => {
  it("should fail to schedule generic restaurants for breakfast/dinner if strict matching causes missing meals", async () => {
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

    // Only generic restaurants provided - no "Cafe" or "Bakery" tags for breakfast
    // No "Steakhouse" or "Dinner" tags explicitly for dinner (though generic restaurants usually work for dinner if tags match? let's see)
    // Actually the code expects "restaurant", "dinner", "steakhouse" for dinner.
    // Use a category that is FOOD but not strictly in the requiredTags list for Breakfast ("cafe", "bakery", "breakfast").
    const candidates = [
      {
        id: "r1",
        name: "Generic Food Place 1",
        metadata: { categories: ["Restaurant"] },
        lat: 0,
        lng: 0,
        cityId: "c1",
        openingHours: { periods: [] }, // Always open
      },
      {
        id: "r2",
        name: "Generic Food Place 2",
        metadata: { categories: ["Diner"] }, // Diner is in FOOD_PATTERN but not in breakfast requiredTags
        lat: 0,
        lng: 0,
        cityId: "c1",
        openingHours: { periods: [] },
      },
      {
        id: "r3",
        name: "Generic Food Place 3",
        metadata: { categories: ["Bistro"] },
        lat: 0,
        lng: 0,
        cityId: "c1",
        openingHours: { periods: [] },
      },
      // Some activities
      { id: "a1", name: "Park", metadata: { categories: ["Park"] }, lat: 0, lng: 0, cityId: "c1" },
      { id: "a2", name: "Museum", metadata: { categories: ["Museum"] }, lat: 0, lng: 0, cityId: "c1" },
    ] as any[];

    const itinerary = await scheduler.assembleItinerary(candidates);
    const activities = itinerary.days[0].activities;

    // We expect Breakfast to be defined (fallback works)
    const breakfast = activities.find((a) => a.startTime === "08:00");
    expect(breakfast).toBeDefined();
    expect(breakfast?.vibe.title).toBeDefined();
  });

  it("should allow Nightlife/Bars for Dinner slot (but not Breakfast)", async () => {
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
      // Only "Bar" available for Dinner
      {
        id: "d1",
        name: "Cool Bar",
        metadata: { categories: ["Bar"] },
        lat: 0,
        lng: 0,
        cityId: "c1",
        openingHours: { periods: [] },
      },
      // Generic restaurant for Breakfast (since we don't want Bar there)
      {
        id: "b1",
        name: "Generic Food",
        metadata: { categories: ["Restaurant"] },
        lat: 0,
        lng: 0,
        cityId: "c1",
        openingHours: { periods: [] },
      },
    ] as any[];

    const itinerary = await scheduler.assembleItinerary(candidates);
    const activities = itinerary.days[0].activities;

    // Dinner is at 19:30
    const dinner = activities.find((a) => a.startTime === "19:30");
    const breakfast = activities.find((a) => a.startTime === "08:00");

    expect(breakfast?.vibe.title).toBe("Generic Food");

    // Dinner should be "Cool Bar" because we now allow nightlife for Dinner
    expect(dinner).toBeDefined();
    expect(dinner?.vibe.title).toBe("Cool Bar");
  });

  it("should use driving for medium distances (>1.5km)", () => {
    // Distance approx 1.8km
    const fromLat = 0;
    const fromLng = 0;
    const toLat = 0.016;
    const toLng = 0;

    const { transitNote, transitDetails } = calculateTransit(fromLat, fromLng, toLat, toLng);

    // Should now be DRIVING because > 1.5km
    expect(transitDetails.mode).toBe("driving");
    // Driving 2.3km @ 25km/h = ~6 mins + buffer
    expect(transitDetails.durationMinutes).toBeLessThan(15);
  });
});
