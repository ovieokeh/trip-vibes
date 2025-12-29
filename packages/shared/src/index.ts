export * from "./types";
export * from "./formatting";
export * from "./vibes/archetypes";
export * from "./vibes/deck";
export * from "./vibes/types";

// Type Aliases for consistency
import { TripActivity, DayPlan } from "./types";
export type ItineraryItem = TripActivity;
export type ItineraryDay = DayPlan;
