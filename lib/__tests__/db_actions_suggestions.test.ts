import { getActivitySuggestionsAction } from "../db-actions";
import { db } from "../db";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db and its methods
vi.mock("../db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  },
}));

describe("getActivitySuggestionsAction", () => {
  const mockCityId = "city-123";
  const mockItinerary: any = {
    days: [
      {
        id: "day-1",
        date: "2024-01-01",
        activities: [],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should map extended fields (phone, website, etc) to Vibe", async () => {
    const mockPlace = {
      id: "place-1",
      name: "Cool Cafe",
      address: "123 Main St",
      cityId: mockCityId,
      lat: 10,
      lng: 20,
      rating: 4.5,
      phone: "+1-555-0123",
      website: "https://example.com",
      priceLevel: 2,
      photoUrls: JSON.stringify(["https://img.com/1.jpg"]),
      metadata: JSON.stringify({ categories: ["cafe"] }),
      openingHours: JSON.stringify({ periods: [] }),
    };

    // Setup mocks
    (db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockPlace]), // Mock return from places table
        }),
      }),
    });

    const suggestions = await getActivitySuggestionsAction(mockCityId, mockItinerary, "day-1");

    expect(suggestions).toHaveLength(1);
    const suggestion = suggestions[0];

    expect(suggestion.title).toBe("Cool Cafe");
    expect(suggestion.phone).toBe("+1-555-0123");
    expect(suggestion.website).toBe("https://example.com");
    expect(suggestion.priceLevel).toBe(2);
    expect(suggestion.photoUrls).toEqual(["https://img.com/1.jpg"]);
  });
});
