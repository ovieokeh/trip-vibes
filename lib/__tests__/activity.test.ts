import { describe, it, expect } from "vitest";
import {
  isPlaceOpenAt,
  recalculateTransitForActivities,
  appendActivityToDay,
  moveActivityBetweenDays,
} from "../activity";
import { DayPlan, TripActivity, Vibe } from "../types";

// Helper to create a mock Vibe
const createMockVibe = (id: string, lat = 10, lng = 10): Vibe => ({
  id,
  title: `Place ${id}`,
  description: "Test description",
  imageUrl: "",
  category: "test",
  cityId: "city-1",
  tags: [],
  lat,
  lng,
});

// Helper to create a mock TripActivity
const createMockActivity = (id: string, startTime: string, endTime: string, lat = 10, lng = 10): TripActivity => ({
  id,
  vibe: createMockVibe(id, lat, lng),
  startTime,
  endTime,
  note: "Test note",
  isAlternative: false,
});

describe("activity utilities", () => {
  describe("isPlaceOpenAt", () => {
    it("returns true when no opening hours data", () => {
      expect(isPlaceOpenAt(undefined, new Date("2024-01-01"), "12:00")).toBe(true);
    });

    it("returns true when open during normal hours", () => {
      const openingHours = {
        open_now: true,
        periods: [{ open: { day: 1, time: "0900" }, close: { day: 1, time: "1700" } }],
        weekday_text: [],
      };
      // Monday = day 1
      const date = new Date("2024-01-01"); // This is a Monday
      expect(isPlaceOpenAt(openingHours, date, "12:00")).toBe(true);
    });

    it("returns false when closed", () => {
      const openingHours = {
        open_now: false,
        periods: [{ open: { day: 1, time: "0900" }, close: { day: 1, time: "1700" } }],
        weekday_text: [],
      };
      const date = new Date("2024-01-01"); // Monday
      expect(isPlaceOpenAt(openingHours, date, "20:00")).toBe(false);
    });

    it("handles overnight venues correctly (e.g., bar 22:00-02:00)", () => {
      // Bar opens Saturday 22:00, closes Sunday 02:00
      const openingHours = {
        open_now: true,
        periods: [{ open: { day: 6, time: "2200" }, close: { day: 0, time: "0200" } }],
        weekday_text: [],
      };

      // Check at 23:00 on Saturday (day 6) - should be open
      const saturday = new Date("2024-01-06"); // Saturday
      expect(isPlaceOpenAt(openingHours, saturday, "23:00")).toBe(true);

      // Check at 01:00 on Sunday (day 0) - should be open
      const sunday = new Date("2024-01-07"); // Sunday
      expect(isPlaceOpenAt(openingHours, sunday, "01:00")).toBe(true);

      // Check at 03:00 on Sunday (day 0) - should be closed
      expect(isPlaceOpenAt(openingHours, sunday, "03:00")).toBe(false);
    });
  });

  describe("recalculateTransitForActivities", () => {
    it("clears transit for first activity", () => {
      const activities = [createMockActivity("1", "09:00", "10:00")];
      const result = recalculateTransitForActivities(activities);

      expect(result[0].transitNote).toBeUndefined();
      expect(result[0].transitDetails).toBeUndefined();
    });

    it("calculates transit for subsequent activities", () => {
      const activities = [
        createMockActivity("1", "09:00", "10:00", 10, 10),
        createMockActivity("2", "11:00", "12:00", 10.01, 10.01),
      ];
      const result = recalculateTransitForActivities(activities);

      expect(result[0].transitNote).toBeUndefined(); // First activity
      expect(result[1].transitNote).toBeDefined(); // Has transit from first
      expect(result[1].transitDetails).toBeDefined();
      expect(result[1].transitDetails?.mode).toBeDefined();
    });
  });

  describe("appendActivityToDay", () => {
    it("calculates correct times when day is empty", () => {
      const day: DayPlan = {
        id: "day-1",
        dayNumber: 1,
        date: "2024-01-01",
        activities: [],
        neighborhood: "Test",
      };
      const vibe = createMockVibe("new");

      const result = appendActivityToDay(day, vibe);

      expect(result).toHaveLength(1);
      expect(result[0].startTime).toBe("12:00"); // Default start
      expect(result[0].endTime).toBe("13:30"); // Default end
    });

    it("calculates times based on last activity end time", () => {
      const day: DayPlan = {
        id: "day-1",
        dayNumber: 1,
        date: "2024-01-01",
        activities: [createMockActivity("1", "09:00", "11:00")],
        neighborhood: "Test",
      };
      const vibe = createMockVibe("new");

      const result = appendActivityToDay(day, vibe);

      expect(result).toHaveLength(2);
      expect(result[1].startTime).toBe("11:30"); // 30 min after 11:00
      expect(result[1].endTime).toBe("13:00"); // 90 min duration
    });

    it("calculates transit from previous activity", () => {
      const day: DayPlan = {
        id: "day-1",
        dayNumber: 1,
        date: "2024-01-01",
        activities: [createMockActivity("1", "09:00", "11:00", 10, 10)],
        neighborhood: "Test",
      };
      const vibe = createMockVibe("new", 10.01, 10.01);

      const result = appendActivityToDay(day, vibe);

      expect(result[1].transitNote).toBeDefined();
      expect(result[1].transitDetails).toBeDefined();
    });
  });

  describe("moveActivityBetweenDays", () => {
    const createDays = (): DayPlan[] => [
      {
        id: "day-1",
        dayNumber: 1,
        date: "2024-01-01",
        activities: [
          createMockActivity("1", "09:00", "10:00", 10, 10),
          createMockActivity("2", "11:00", "12:00", 10.01, 10.01),
        ],
        neighborhood: "A",
      },
      {
        id: "day-2",
        dayNumber: 2,
        date: "2024-01-02",
        activities: [createMockActivity("3", "09:00", "10:00", 20, 20)],
        neighborhood: "B",
      },
    ];

    it("moves activity and recalculates times", () => {
      const days = createDays();
      const result = moveActivityBetweenDays("day-1", "day-2", "2", days);

      expect(result).not.toBeNull();
      if (!result) return;

      // Source day should have 1 activity
      const sourceDay = result.find((d) => d.id === "day-1");
      expect(sourceDay?.activities).toHaveLength(1);

      // Target day should have 2 activities
      const targetDay = result.find((d) => d.id === "day-2");
      expect(targetDay?.activities).toHaveLength(2);

      // Moved activity should have new times
      const movedAct = targetDay?.activities[1];
      expect(movedAct?.startTime).toBe("10:30"); // After first activity
    });

    it("recalculates transit for both days", () => {
      const days = createDays();
      const result = moveActivityBetweenDays("day-1", "day-2", "2", days);

      expect(result).not.toBeNull();
      if (!result) return;

      // Source day - first activity has no transit
      const sourceDay = result.find((d) => d.id === "day-1");
      expect(sourceDay?.activities[0].transitNote).toBeUndefined();

      // Target day - moved activity has transit
      const targetDay = result.find((d) => d.id === "day-2");
      expect(targetDay?.activities[1].transitNote).toBeDefined();
      expect(targetDay?.activities[1].transitDetails).toBeDefined();
    });

    it("returns null when moving to same day", () => {
      const days = createDays();
      const result = moveActivityBetweenDays("day-1", "day-1", "1", days);
      expect(result).toBeNull();
    });
  });
});
