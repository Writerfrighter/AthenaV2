export interface DashboardStats {
  totalTeams: number;
  uniqueMatches: number;
  totalMatches: number;
  totalPitScouts: number;
  matchCompletion: number;
  teamStats: Array<{
    teamNumber: number;
    name: string;
    matchesPlayed: number;
    totalEPA: number;
  }>;
  recentActivity: Array<{
    teamNumber: number;
    matchNumber: number;
    timestamp: Date;
  }>;
}
