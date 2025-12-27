import { SchedulerEngine } from "../scheduler";
import { EngineCandidate } from "../types";
import { describe, it, expect, vi } from "vitest";

const MOCK_PREFS = {
  cityId: "amsterdam",
  startDate: "2024-05-10",
  endDate: "2024-05-12",
  budget: "medium" as const,
  likedVibes: [],
  dislikedVibes: [],
  vibeProfile: { weights: {} },
};

describe("SchedulerEngine Deduplication", () => {
  it("should not use the same place twice in the itinerary (by ID)", () => {
    const candidate: EngineCandidate = {
      id: "place-1",
      foursquareId: "fsq-1",
      cityId: "amsterdam",
      name: "Cafe De Jaren",
      metadata: { categories: ["cafe"], source: "foursquare", website: null, phone: null },
      lat: 0,
      lng: 0,
      googlePlacesId: null,
      address: null,
      rating: null,
      website: null,
      phone: null,
      imageUrl: null,
    };

    const candidates = [candidate, candidate, candidate]; // Duplicates
    const scheduler = new SchedulerEngine(MOCK_PREFS);
    const itinerary = scheduler.assembleItinerary(candidates);

    // Count occurrences of "place-1" in whole itinerary
    let count = 0;
    itinerary.days.forEach((day) => {
      day.activities.forEach((act) => {
        if (act.vibe.id === "place-1") count++;
        if (act.alternative?.id === "place-1") count++;
      });
    });

    expect(count).toBe(1);
  });

  it("should not use different candidates with same foursquareId twice", () => {
    const c1: EngineCandidate = {
      id: "place-1",
      foursquareId: "fsq-common",
      cityId: "amsterdam",
      name: "Cafe Common",
      metadata: { categories: ["cafe"], source: "foursquare", website: null, phone: null },
      lat: 0,
      lng: 0,
      googlePlacesId: null,
      address: null,
      rating: null,
      website: null,
      phone: null,
      imageUrl: null,
    };

    const c2: EngineCandidate = {
      ...c1,
      id: "place-2", // Different internal ID
    };

    const candidates = [c1, c2];
    const scheduler = new SchedulerEngine(MOCK_PREFS);
    const itinerary = scheduler.assembleItinerary(candidates);

    let count = 0;
    itinerary.days.forEach((day) => {
      day.activities.forEach((act) => {
        if (act.vibe.id === "place-1" || act.vibe.id === "place-2") count++;
        // Check alternates too
      });
    });

    expect(count).toBe(1);
  });
});
