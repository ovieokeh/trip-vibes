import { describe, it, expect } from "vitest";
import { isMeal, isActivity } from "../utils";
import { EngineCandidate } from "../../types";

describe("Classification Utils", () => {
  const createCandidate = (name: string, categories: string[]): EngineCandidate =>
    ({
      id: "test-id",
      name,
      metadata: { categories },
      lat: 0,
      lng: 0,
      cityId: "c1",
    } as any);

  describe("isMeal", () => {
    it("should identify obvious restaurants as meals", () => {
      expect(isMeal(createCandidate("Thai Restaurant", ["Thai Restaurant"]))).toBe(true);
      expect(isMeal(createCandidate("Joes Diner", ["Diner"]))).toBe(true);
    });

    it("should identify ambiguous names containing activity words as meals", () => {
      // Regressions
      expect(isMeal(createCandidate("Park Restaurant", ["Restaurant"]))).toBe(true);
      expect(isMeal(createCandidate("Sauce Park Belgian Restaurant", ["Belgian Restaurant"]))).toBe(true);
      expect(isMeal(createCandidate("Museum Cafe", ["Cafe"]))).toBe(true);
    });

    it("should NOT identify true activities as meals", () => {
      expect(isMeal(createCandidate("Central Park", ["Park"]))).toBe(false);
      expect(isMeal(createCandidate("National Museum", ["History Museum"]))).toBe(false);
    });

    it("should identify hybrids as meals", () => {
      expect(isMeal(createCandidate("Chelsea Market", ["Market"]))).toBe(true);
    });
  });

  describe("isActivity", () => {
    it("should identify obvious activities", () => {
      expect(isActivity(createCandidate("Central Park", ["Park"]))).toBe(true);
      expect(isActivity(createCandidate("Louvre", ["Art Museum"]))).toBe(true);
    });

    it("should NOT identify restaurants as activities (even with ambiguous names)", () => {
      expect(isActivity(createCandidate("Thai Restaurant", ["Thai Restaurant"]))).toBe(false);

      // The Critical Regressions
      expect(isActivity(createCandidate("Park Restaurant", ["Restaurant"]))).toBe(false);
      expect(isActivity(createCandidate("Sauce Park Belgian Restaurant", ["Belgian Restaurant"]))).toBe(false);
      expect(isActivity(createCandidate("Museum Cafe", ["Cafe"]))).toBe(false);
    });

    it("should identify hybrids as activities", () => {
      expect(isActivity(createCandidate("Chelsea Market", ["Market"]))).toBe(true);
    });

    it("should fallback to activity for unknown places that are NOT food", () => {
      expect(isActivity(createCandidate("Random Place", ["General Location"]))).toBe(true);
    });
  });
});
