export interface TeamStats {
  totalMatches: number;
  avgScore: number;
  epa: number;
  autoStats: Record<string, number>;
  teleopStats: Record<string, number>;
  endgameStats: Record<string, number>;
}

export interface EPABreakdown {
  team?: string;
  auto: number;
  teleop: number;
  endgame: number;
  penalties: number;
  totalEPA: number;
}
