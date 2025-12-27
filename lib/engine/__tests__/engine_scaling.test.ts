import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MatchingEngine } from "../engine";
import { UserPreferences } from "../../types";
import { DiscoveryEngine } from "../discovery";
import { ScoringEngine } from "../scoring";
import { SchedulerEngine } from "../scheduler";

// Mock DB only
vi.mock("../../db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([{ id: "city-123", name: "Test City", slug: "test-city" }])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ onConflictDoNothing: vi.fn(() => Promise.resolve()) })),
    })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })) })),
  },
}));

describe("MatchingEngine Scaling Integration", () => {
  let engine: MatchingEngine;

  // Helper to create prefs with specific dates
  const createPrefs = (start: string, end: string): UserPreferences => ({
    cityId: "city-123",
    startDate: start,
    endDate: end,
    budget: "medium",
    likedVibes: ["nature-lover", "foodie"],
    dislikedVibes: [],
    vibeProfile: { weights: { nature: 10, food: 8 }, swipes: 0 },
  });

  beforeEach(() => {
    vi.restoreAllMocks(); // Clear spies
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should calculate correct minCandidates for a short trip (3 days)", async () => {
    const prefs = createPrefs("2025-06-01", "2025-06-03"); // 3 Days
    engine = new MatchingEngine(prefs, vi.fn());

    const mockCandidates: any[] = [{ id: "place-1", name: "Park", rating: 5, metadata: { categories: ["park"] } }];
    const mockItinerary: any = { id: "itinerary-1", days: [] };

    const findSpy = vi.spyOn(DiscoveryEngine.prototype, "findCandidates").mockResolvedValue(mockCandidates);
    const rankSpy = vi.spyOn(ScoringEngine.prototype, "rankCandidates").mockReturnValue(mockCandidates);
    const assembleSpy = vi.spyOn(SchedulerEngine.prototype, "assembleItinerary").mockReturnValue(mockItinerary);

    await engine.generate();

    // 3 Days * 4 = 12 each
    expect(findSpy).toHaveBeenCalledWith(expect.anything(), { minMeals: 12, minActivities: 12 });
  });

  it("should calculate correct minCandidates for a long trip (7 days)", async () => {
    const prefs = createPrefs("2025-06-01", "2025-06-07"); // 7 Days
    engine = new MatchingEngine(prefs, vi.fn());

    const mockCandidates: any[] = [{ id: "place-1", name: "Park", rating: 5, metadata: { categories: ["park"] } }];
    const mockItinerary: any = { id: "itinerary-1", days: [] };

    const findSpy = vi.spyOn(DiscoveryEngine.prototype, "findCandidates").mockResolvedValue(mockCandidates);
    const rankSpy = vi.spyOn(ScoringEngine.prototype, "rankCandidates").mockReturnValue(mockCandidates);
    const assembleSpy = vi.spyOn(SchedulerEngine.prototype, "assembleItinerary").mockReturnValue(mockItinerary);

    await engine.generate();

    // 7 Days * 4 = 28 each
    expect(findSpy).toHaveBeenCalledWith(expect.anything(), { minMeals: 28, minActivities: 28 });
  });

  it("should handle single day trip (1 day)", async () => {
    const prefs = createPrefs("2025-06-01", "2025-06-01"); // 1 Day
    engine = new MatchingEngine(prefs, vi.fn());

    const mockCandidates: any[] = [];
    const mockItinerary: any = { days: [] };

    const findSpy = vi.spyOn(DiscoveryEngine.prototype, "findCandidates").mockResolvedValue(mockCandidates);
    vi.spyOn(ScoringEngine.prototype, "rankCandidates").mockReturnValue(mockCandidates);
    vi.spyOn(SchedulerEngine.prototype, "assembleItinerary").mockReturnValue(mockItinerary);

    await engine.generate();

    // 1 Day * 4 = 4 items
    expect(findSpy).toHaveBeenCalledWith(expect.anything(), { minMeals: 4, minActivities: 4 });
  });

  it("should handle lopsided candidate pools (e.g. all activities, no meals)", async () => {
    const prefs = createPrefs("2025-06-01", "2025-06-02"); // 2 Days
    engine = new MatchingEngine(prefs, vi.fn());

    // Discovery returns many items, but ALL are activities
    const mockCandidates: any[] = Array(50).fill({
      id: "place-1",
      name: "Museum",
      rating: 5,
      metadata: { categories: ["museum"] },
    });
    const mockItinerary: any = { id: "itinerary-1", days: [] };

    const findSpy = vi.spyOn(DiscoveryEngine.prototype, "findCandidates").mockResolvedValue(mockCandidates);
    vi.spyOn(ScoringEngine.prototype, "rankCandidates").mockReturnValue(mockCandidates);
    vi.spyOn(SchedulerEngine.prototype, "assembleItinerary").mockReturnValue(mockItinerary);

    await engine.generate();

    // 2 Days * 4 meals = 8 meals min
    // 2 Days * 4 activities = 8 activities min
    expect(findSpy).toHaveBeenCalledWith(expect.anything(), { minMeals: 8, minActivities: 8 });
  });
});
