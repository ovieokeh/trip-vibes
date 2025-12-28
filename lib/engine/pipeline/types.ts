import { EngineCandidate, TripActivity, DayPlan, UserPreferences } from "../../types";

export interface ScheduleState {
  originalCandidates: EngineCandidate[];
  remainingCandidates: EngineCandidate[]; // Candidates available for selection

  // The schedule being built
  days: DayPlan[];

  // Track globally used IDs to prevent duplicates across days
  usedIds: Set<string>;
  usedExternalIds: Set<string>;
}

export interface PlannerStage {
  name: string;
  run(state: ScheduleState, prefs: UserPreferences): Promise<ScheduleState>;
}
