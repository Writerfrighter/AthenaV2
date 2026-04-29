export interface AnalysisMetricDefinition {
  key: string;
  label: string;
  category: string;
  valueType: "rate" | "average";
}

export interface AnalysisData {
  availableMetrics?: AnalysisMetricDefinition[];
  scoringAnalysis: Array<{
    category: string;
    average: number;
    count: number;
    data: number[];
  }>;
  teamEPAData: Array<{
    teamNumber: number;
    name: string;
    matchesPlayed: number;
    totalEPA: number;
    autoEPA: number;
    teleopEPA: number;
    endgameEPA: number;
    penaltiesEPA: number;
    detailMetrics?: Record<string, number>;
  }>;
  totalMatches: number;
  totalTeams: number;
}
