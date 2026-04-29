import type { CompetitionType } from "../competition/competition";

export interface ScoringDefinition {
  label: string;
  description: string;
  points?: number;
  pointValues?: Record<string, number>;
  type?: "boolean" | "select" | "number";
  dependsOn?: string;
  increments?: number[];
}

export interface YearConfig {
  competitionType: CompetitionType;
  gameName: string;
  startPositions?: string[];
  scoring: {
    autonomous: Record<string, ScoringDefinition>;
    teleop: Record<string, ScoringDefinition>;
    endgame: Record<string, ScoringDefinition>;
    fouls?: Record<string, ScoringDefinition>;
  };
  pitScouting: {
    autonomous: Record<
      string,
      {
        label: string;
        type: "text" | "number" | "boolean" | "select";
        options?: string[];
      }
    >;
    teleoperated: Record<
      string,
      {
        label: string;
        type: "text" | "number" | "boolean" | "select";
        options?: string[];
      }
    >;
    driveTeam?: Record<
      string,
      {
        label: string;
        type: "text" | "number" | "boolean" | "select";
        options?: string[];
      }
    >;
    endgame: Record<
      string,
      {
        label: string;
        type: "text" | "number" | "boolean" | "select";
        options?: string[];
      }
    >;
  };
}

export interface GameConfig {
  FRC: {
    [year: string]: YearConfig;
  };
  FTC: {
    [year: string]: YearConfig;
  };
}
