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
    insert: vi.fn(() => ({ values: vi.fn(() => ({ onConflictDoNothing: vi.fn(() => Promise.resolve()) })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })) })),
  },
}));

describe("MatchingEngine Refactor Integration", () => {
  let engine: MatchingEngine;
  const mockPrefs: UserPreferences = {
    cityId: "city-123",
    startDate: "2025-06-01",
    endDate: "2025-06-03",
    budget: "medium",
    likedVibes: ["nature-lover", "foodie"],
    dislikedVibes: [],
    vibeProfile: { weights: { nature: 10, food: 8 }, swipes: 0 },
  };

  beforeEach(() => {
    vi.restoreAllMocks(); // Clear spies
    engine = new MatchingEngine(mockPrefs, vi.fn());
  });

  it("should coordinate discovery, scoring, and scheduling", async () => {
    // Setup Spies
    const mockCandidates: any[] = [{ id: "place-1", name: "Park", rating: 5 }];
    const mockItinerary: any = { id: "itinerary-1", days: [] };

    const findSpy = vi.spyOn(DiscoveryEngine.prototype, "findCandidates").mockResolvedValue(mockCandidates);
    const rankSpy = vi.spyOn(ScoringEngine.prototype, "rankCandidates").mockReturnValue(mockCandidates);
    const assembleSpy = vi.spyOn(SchedulerEngine.prototype, "assembleItinerary").mockReturnValue(mockItinerary);

    // Execute
    const result = await engine.generate();

    // Verify Flow
    expect(findSpy).toHaveBeenCalled();
    expect(rankSpy).toHaveBeenCalledWith(mockCandidates);
    expect(assembleSpy).toHaveBeenCalled();
    expect(result).toBe(mockItinerary);
  });
});
