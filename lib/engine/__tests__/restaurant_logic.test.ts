import { describe, it, expect } from "vitest";
import { SchedulerEngine } from "../scheduler";
import { UserPreferences } from "../../types";

describe("Restaurant Integration Logic", () => {
  it("should find meals even with unconventional categories", () => {
    const mockPrefs: UserPreferences = {
      cityId: "city-123",
      startDate: "2025-06-01",
      endDate: "2025-06-01",
      budget: "medium",
      likedVibes: ["nature-lover"], // No foodie vibes
      dislikedVibes: [],
      vibeProfile: { weights: { nature: 10 }, swipes: 0 },
    };
    const scheduler = new SchedulerEngine(mockPrefs);

    const candidates = [
      { id: "m1", name: "Taco Shop", metadata: { categories: ["Taco Place"] }, lat: 0, lng: 0, cityId: "c1" },
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
    expect(startTimes).toContain("09:00");
    expect(startTimes).toContain("10:30");
    expect(startTimes).toContain("13:00");
    expect(startTimes).toContain("15:00");
    expect(startTimes).toContain("19:30");
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
    const activity = itinerary.days[0].activities.find((a) => a.startTime === "10:30");

    expect(activity?.vibe.title).toBe("Park");
    expect(activity?.vibe.title).not.toBe("Steakhouse");
  });
});
