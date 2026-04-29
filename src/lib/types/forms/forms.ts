export interface DynamicMatchData {
  matchNumber: number;
  teamNumber: number;
  alliance: "red" | "blue";
  alliancePosition?: number;
  autonomous: Record<string, number | string | boolean>;
  teleop: Record<string, number | string | boolean>;
  endgame: Record<string, number | string | boolean>;
  fouls: Record<string, number | string | boolean>;
  notes: string;
}

export interface DynamicPitData {
  team: number;
  drivetrain: string;
  weight: string;
  length: string;
  width: string;
  hasAuto: boolean;
  autoDrawing: string;
  notes: string;
  gameSpecificData: Record<string, number | string | boolean | string[]>;
}
