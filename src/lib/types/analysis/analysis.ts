export interface AnalysisMetricDefinition {
  key: string;
  label: string;
  category: string;
  valueType: "rate" | "average";
}

export type InsightCalculation =
  | {
      type: "booleanRate";
      key: string;
    }
  | {
      type: "ratio";
      numeratorKeys: string[];
      denominatorKeys: string[];
    }
  | {
      type: "sum";
      keys: string[];
    };

export interface AnalysisInsightDefinition {
  id: string;
  title: string;
  description?: string;
  ranking: "higher" | "lower";
  valueFormat?: "percent" | "number";
  rawLabel?: string;
  calculation: InsightCalculation;
}

export interface AnalysisInsightsConfig {
  insights: AnalysisInsightDefinition[];
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
    totalEPAStats?: {
      min: number;
      q1: number;
      median: number;
      q3: number;
      max: number;
    };
    detailMetrics?: Record<string, number>;
  }>;
  totalMatches: number;
  totalTeams: number;
}
