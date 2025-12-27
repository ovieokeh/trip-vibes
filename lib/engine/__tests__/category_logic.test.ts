import { describe, it, expect, vi, beforeEach } from "vitest";
import { DiscoveryEngine } from "../discovery";
import { UserPreferences } from "../../types";
import axios from "axios";

// Mock dependencies
vi.mock("axios");
vi.mock("../../db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])), // Empty DB response to force FSQ fetch
      })),
    })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ onConflictDoNothing: vi.fn(() => Promise.resolve()) })) })),
  },
}));

describe("DiscoveryEngine Category Logic", () => {
  let engine: DiscoveryEngine;
  const mockPrefs: UserPreferences = {
    cityId: "city-123",
    likedVibes: [],
    dislikedVibes: [],
    startDate: "2025-01-01",
    endDate: "2025-01-02",
    budget: "medium",
    vibeProfile: { weights: {}, swipes: 0 },
  };

  beforeEach(() => {
    process.env.FOURSQUARE_API_KEY = "mock-key";
    vi.restoreAllMocks();
    engine = new DiscoveryEngine(mockPrefs);
    (axios.get as any).mockResolvedValue({ data: { results: [] } });
  });

  it("should resolve top-level category for a nested category", async () => {
    // Accessing private method for unit testing logic (or we can make it public/internal)
    // Alternatively, verify via fetchFromFoursquare side effect.

    // "Attraction" (5109983191d435c0d71c2bb1) -> "Amusement Park" -> "Arts and Entertainment" (4d4b7104d754a06370d81259)
    const deepChildId = "5109983191d435c0d71c2bb1";
    const expectedTopLevelId = "4d4b7104d754a06370d81259";

    const result = (engine as any).getTopLevelCategoryId(deepChildId);
    expect(result).toBe(expectedTopLevelId);
  });

  it("should return the same ID if it is already top-level", async () => {
    const topLevelId = "4d4b7104d754a06370d81259"; // Arts and Entertainment
    const result = (engine as any).getTopLevelCategoryId(topLevelId);
    expect(result).toBe(topLevelId);
  });

  it("should use top-level categories when fetching from Foursquare", async () => {
    // Mock getTopLevelCategoryId to return specific things or trust the real implementation
    // We want to test the full flow.

    // Override mapVibesToCategoryIds to return our specific test ID
    vi.spyOn(engine as any, "mapVibesToCategoryIds").mockReturnValue(["5109983191d435c0d71c2bb1"]); // Attraction

    await (engine as any).fetchFromFoursquare({ name: "City", id: "city-1" }, ["5109983191d435c0d71c2bb1"]);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("search"),
      expect.objectContaining({
        params: expect.objectContaining({
          categories: expect.stringContaining("4d4b7104d754a06370d81259"), // Top level ID
        }),
      })
    );
  });
});
