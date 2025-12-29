export interface VibeProfile {
  weights: Record<string, number>;
  swipes: number;
}

export interface SwipeAction {
  archetypeId: string;
  liked: boolean;
}
