import { describe, it, expect } from "vitest";
import { SchedulerEngine } from "../scheduler";
import { UserPreferences, EngineCandidate } from "../../types";

// Mock Data
const mockPrefs: UserPreferences = {
  cityId: "rotterdam",
  startDate: "2025-01-23",
  endDate: "2025-01-24",
  budget: "medium",
  likedVibes: [],
  dislikedVibes: [],
  vibeProfile: { weights: {}, swipes: 0 },
};

const mockCandidates: EngineCandidate[] = [
  // Meal: Breakfast 1
  {
    id: "1",
    foursquareId: "fsq1",
    googlePlacesId: null,
    name: "Bagel & Beans",
    cityId: "rotterdam",
    lat: 51.92,
    lng: 4.47,
    address: "Hoogstraat 123",
    rating: 8.5,
    website: null,
    phone: null,
    imageUrl: "https://example.com/image1.jpg",
    metadata: { categories: ["Bagel Shop", "Breakfast Spot"], source: "fsq", website: null, phone: null },
    photos: [],
    _score: 100,
  },
  // Meal: Dinner 1
  {
    id: "2",
    foursquareId: "fsq2",
    googlePlacesId: null,
    name: "Bazar",
    cityId: "rotterdam",
    lat: 51.91,
    lng: 4.47,
    address: "Witte de Withstraat 16",
    rating: 8.8,
    website: null,
    phone: null,
    imageUrl: "https://example.com/image2.jpg",
    metadata: { categories: ["Middle Eastern Restaurant"], source: "fsq", website: null, phone: null },
    photos: [],
    _score: 100,
  },
  // Meal: Dinner 2 (Shared for Day 2)
  {
    id: "2b",
    foursquareId: "fsq2b",
    googlePlacesId: null,
    name: "Old Rotterdam",
    cityId: "rotterdam",
    lat: 51.915,
    lng: 4.475,
    address: "Coolsingel 1",
    rating: 8.7,
    website: null,
    phone: null,
    imageUrl: "https://example.com/image2b.jpg",
    metadata: { categories: ["Dutch Restaurant"], source: "fsq", website: null, phone: null },
    photos: [],
    _score: 98,
  },
  // Activity: Museum
  {
    id: "3",
    foursquareId: "fsq3",
    googlePlacesId: null,
    name: "Depot Boijmans",
    cityId: "rotterdam",
    lat: 51.91,
    lng: 4.47,
    address: "Museumpark 24",
    rating: 9.0,
    website: null,
    phone: null,
    imageUrl: "https://example.com/image3.jpg",
    metadata: { categories: ["Art Museum"], source: "fsq", website: null, phone: null },
    photos: [],
    _score: 95,
  },
  // Activity: Park
  {
    id: "4",
    foursquareId: "fsq4",
    googlePlacesId: null,
    name: "Het Park",
    cityId: "rotterdam",
    lat: 51.9,
    lng: 4.46,
    address: "Baden Powelllaan 2",
    rating: 9.2,
    website: null,
    phone: null,
    imageUrl: "https://example.com/image4.jpg",
    metadata: { categories: ["Park"], source: "fsq", website: null, phone: null },
    photos: [],
    _score: 90,
  },
  // Meal: Breakfast 2 (Low score, to test balancing)
  {
    id: "5",
    foursquareId: "fsq5",
    googlePlacesId: null,
    name: "Starbucks",
    cityId: "rotterdam",
    lat: 51.92,
    lng: 4.48,
    address: "Station Plein",
    rating: 7.0,
    website: null,
    phone: null,
    imageUrl: "https://example.com/image5.jpg",
    metadata: { categories: ["Cafe"], source: "fsq", website: null, phone: null },
    photos: [],
    _score: 20, // Very low score
  },
];

describe("Scheduler Pipeline", () => {
  it("should generate a valid itinerary with anchors and activities", async () => {
    const engine = new SchedulerEngine(mockPrefs);
    const itinerary = await engine.assembleItinerary(mockCandidates);

    expect(itinerary).toBeDefined();
    expect(itinerary.days.length).toBe(2); // 23rd, 24th

    const day1 = itinerary.days[0];
    console.log(
      "Day 1 Activities:",
      day1.activities.map((a) => `${a.startTime} - ${a.vibe.title}`)
    );

    // Check Anchors are present
    const breakfast = day1.activities.find((a) => a.startTime === "08:00");
    const dinner = day1.activities.find((a) => a.startTime === "19:30");

    expect(breakfast).toBeDefined();
    expect(breakfast?.vibe.title).toBe("Bagel & Beans");

    expect(dinner).toBeDefined();
    expect(dinner?.vibe.title).toBe("Bazar");

    // Check Activities fill the gap (09:00 - 19:30)
    // Depot Boijmans should be there
    const activity = day1.activities.find((a) => a.vibe.title === "Depot Boijmans");
    expect(activity).toBeDefined();

    // Ensure chronological order
    // 08:00 -> Breakfast
    // ... Activities
    // 19:30 -> Dinner

    const times = day1.activities.map((a) => a.startTime);
    const sortedTimes = [...times].sort();
    expect(times).toEqual(sortedTimes);

    // DAY 2 CHECK
    const day2 = itinerary.days[1];
    console.log(
      "Day 2 Activities:",
      day2.activities.map((a) => `${a.startTime} - ${a.vibe.title}`)
    );

    const b2 = day2.activities.find((a) => a.startTime === "08:00");
    const d2 = day2.activities.find((a) => a.startTime === "19:30");

    // This is expected to fail with current mock data if it consumes the same candidates
    expect(b2, "Day 2 Breakfast should be present").toBeDefined();
    expect(d2, "Day 2 Dinner should be present").toBeDefined();

    // IMAGE CHECK
    day1.activities.forEach((a) => {
      expect(a.vibe.imageUrl, `Activity ${a.vibe.title} should have an imageUrl`).not.toBe("");
    });
  });
});
