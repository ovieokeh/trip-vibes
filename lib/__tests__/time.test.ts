import { describe, it, expect } from "vitest";
import { parseTimeToMinutes, minutesToTime, addMinutesToTime, calculateNextActivityTime, timeToInt } from "../time";

describe("time utilities", () => {
  describe("parseTimeToMinutes", () => {
    it("converts HH:MM to minutes since midnight", () => {
      expect(parseTimeToMinutes("00:00")).toBe(0);
      expect(parseTimeToMinutes("01:30")).toBe(90);
      expect(parseTimeToMinutes("12:00")).toBe(720);
      expect(parseTimeToMinutes("23:59")).toBe(1439);
    });
  });

  describe("minutesToTime", () => {
    it("converts minutes to HH:MM format", () => {
      expect(minutesToTime(0)).toBe("00:00");
      expect(minutesToTime(90)).toBe("01:30");
      expect(minutesToTime(720)).toBe("12:00");
    });

    it("handles midnight rollover correctly", () => {
      expect(minutesToTime(1440)).toBe("00:00"); // Next day midnight
      expect(minutesToTime(1500)).toBe("01:00"); // Next day 1am
      expect(minutesToTime(1530)).toBe("01:30"); // Next day 1:30am
    });

    it("handles values over 24 hours", () => {
      expect(minutesToTime(2880)).toBe("00:00"); // 48 hours = 0:00
      expect(minutesToTime(2970)).toBe("01:30"); // 49.5 hours
    });
  });

  describe("addMinutesToTime", () => {
    it("adds minutes to a time string", () => {
      expect(addMinutesToTime("12:00", 60)).toBe("13:00");
      expect(addMinutesToTime("09:30", 90)).toBe("11:00");
    });

    it("handles midnight rollover", () => {
      expect(addMinutesToTime("23:30", 90)).toBe("01:00"); // Crosses midnight
      expect(addMinutesToTime("23:00", 120)).toBe("01:00");
    });

    it("handles noon correctly", () => {
      expect(addMinutesToTime("12:00", 60)).toBe("13:00");
      expect(addMinutesToTime("11:30", 30)).toBe("12:00");
    });
  });

  describe("calculateNextActivityTime", () => {
    it("calculates start and end time after last activity", () => {
      const result = calculateNextActivityTime("14:00");
      expect(result.startTime).toBe("14:30"); // 30 min gap
      expect(result.endTime).toBe("16:00"); // 90 min duration
    });

    it("handles midnight rollover when scheduling late-night activities", () => {
      const result = calculateNextActivityTime("23:30");
      expect(result.startTime).toBe("00:00"); // Next day
      expect(result.endTime).toBe("01:30");
    });

    it("respects custom gap and duration", () => {
      const result = calculateNextActivityTime("10:00", 60, 120);
      expect(result.startTime).toBe("11:00"); // 60 min gap
      expect(result.endTime).toBe("13:00"); // 120 min duration
    });
  });

  describe("timeToInt", () => {
    it("converts time string to integer for comparison", () => {
      expect(timeToInt("09:30")).toBe(930);
      expect(timeToInt("13:00")).toBe(1300);
      expect(timeToInt("00:00")).toBe(0);
      expect(timeToInt("23:59")).toBe(2359);
    });
  });
});
