import type { CompetitionType } from "../competition/competition";

export interface Picklist {
  id?: number;
  eventCode: string;
  year: number;
  competitionType: CompetitionType;
  picklistType: "pick1" | "pick2" | "blacklist" | "main";
  created_at?: Date;
  updated_at?: Date;
}

export interface PicklistEntry {
  id?: number;
  picklistId: number;
  teamNumber: number;
  rank: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface PicklistNote {
  id?: number;
  picklistId: number;
  teamNumber: number;
  note: string;
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface PicklistData {
  teams: Array<{
    teamNumber: number;
    name: string;
    driveTrain: string;
    weight: number;
    length: number;
    width: number;
    matchesPlayed: number;
    totalEPA: number;
    autoEPA: number;
    teleopEPA: number;
    endgameEPA: number;
    rank: number;
  }>;
  totalTeams: number;
  lastUpdated: string;
}
