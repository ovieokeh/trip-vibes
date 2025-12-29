import { describe, it, expect } from "vitest";
import { isMeal, isActivity } from "../utils";
import { EngineCandidate } from "../../types";

describe("Classification Regex Bugs", () => {
  it('should not classify Stedelijk Museum as a meal because of "deli"', () => {
    const museum: EngineCandidate = {
      id: "1",
      foursquareId: null,
      googlePlacesId: null,
      name: "Stedelijk Museum Schiedam",
      cityId: "rotterdam",
      address: null,
      lat: 0,
      lng: 0,
      rating: 4.5,
      website: null,
      phone: null,
      imageUrl: null,
      metadata: {
        categories: ["History Museum"],
        source: "foursquare",
        website: null,
        phone: null,
      },
      photos: [],
      _score: 100,
    };

    // currently fails (returns true)
    console.log("Stedelijk isMeal:", isMeal(museum));
    expect(isMeal(museum)).toBe(false);
    expect(isActivity(museum)).toBe(true);
  });

  it('should not classify Deliplein as a meal because of "deli"', () => {
    const plaza: EngineCandidate = {
      id: "2",
      foursquareId: null,
      googlePlacesId: null,
      name: "Deliplein",
      cityId: "rotterdam",
      address: null,
      lat: 0,
      lng: 0,
      rating: 4.5,
      website: null,
      phone: null,
      imageUrl: null,
      metadata: {
        categories: ["Plaza"],
        source: "foursquare",
        website: null,
        phone: null,
      },
      photos: [],
      _score: 100,
    };

    // currently fails (returns true)
    console.log("Deliplein isMeal:", isMeal(plaza));
    expect(isMeal(plaza)).toBe(false);
    expect(isActivity(plaza)).toBe(true);
  });

  it("should still classify a real Deli as a meal", () => {
    const deli: EngineCandidate = {
      id: "3",
      foursquareId: null,
      googlePlacesId: null,
      name: "Joe's Deli",
      cityId: "rotterdam",
      address: null,
      lat: 0,
      lng: 0,
      rating: 4.5,
      website: null,
      phone: null,
      imageUrl: null,
      metadata: {
        categories: ["Deli"],
        source: "foursquare",
        website: null,
        phone: null,
      },
      photos: [],
      _score: 100,
    };

    expect(isMeal(deli)).toBe(true);
  });
});
