import { EngineCandidate, Itinerary, UserPreferences, DayPlan } from "../types";
import { v4 as uuidv4 } from "uuid";
import { ScheduleState, PlannerStage } from "./pipeline/types";
import { AnchorMealsStage } from "./pipeline/stages/anchor_meals";
import { FillActivitiesStage } from "./pipeline/stages/fill_activities";

export class SchedulerEngine {
  private prefs: UserPreferences;
  private pipeline: PlannerStage[];

  constructor(prefs: UserPreferences) {
    this.prefs = prefs;
    this.pipeline = [new AnchorMealsStage(), new FillActivitiesStage()];
  }

  public async assembleItinerary(
    candidates: EngineCandidate[],
    cityCoordinates?: { lat: number; lng: number }
  ): Promise<Itinerary> {
    const start = new Date(this.prefs.startDate);
    const end = new Date(this.prefs.endDate);
    const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);

    // Initialize State
    const days: DayPlan[] = [];
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push({
        id: uuidv4(),
        dayNumber: i + 1,
        date: date.toISOString().split("T")[0],
        activities: [],
        neighborhood: "City Center", // Could be dynamic later
      });
    }

    let state: ScheduleState = {
      originalCandidates: candidates,
      remainingCandidates: [...candidates], // working copy
      days,
      usedIds: new Set<string>(),
      usedExternalIds: new Set<string>(),
      cityCoordinates,
    };

    // Run Pipeline
    for (const stage of this.pipeline) {
      console.log(`[Scheduler] Running stage: ${stage.name}`);
      state = await stage.run(state, this.prefs);
    }

    return {
      id: uuidv4(),
      cityId: this.prefs.cityId,
      days: state.days,
      createdAt: new Date().toISOString(),
    };
  }
}
