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

    // Scaling: minMeals = max(20, days*4), minActivities = max(30, days*5)
    // 3 days: minMeals = max(20, 12) = 20, minActivities = max(30, 15) = 30
    expect(findSpy).toHaveBeenCalledWith(expect.anything(), { minMeals: 20, minActivities: 30 }, expect.anything());
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

    // Scaling: minMeals = max(20, days*4), minActivities = max(30, days*5)
    // 7 days: minMeals = max(20, 28) = 28, minActivities = max(30, 35) = 35
    expect(findSpy).toHaveBeenCalledWith(expect.anything(), { minMeals: 28, minActivities: 35 }, expect.anything());
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

    // Scaling: minMeals = max(20, days*4), minActivities = max(30, days*5)
    // 1 day: minMeals = max(20, 4) = 20, minActivities = max(30, 5) = 30
    expect(findSpy).toHaveBeenCalledWith(expect.anything(), { minMeals: 20, minActivities: 30 }, expect.anything());
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

    // Scaling: minMeals = max(20, days*4), minActivities = max(30, days*5)
    // 2 days: minMeals = max(20, 8) = 20, minActivities = max(30, 10) = 30
    expect(findSpy).toHaveBeenCalledWith(expect.anything(), { minMeals: 20, minActivities: 30 }, expect.anything());
  });
});
