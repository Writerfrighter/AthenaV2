import type { MatchEntry, PitEntry } from "../db/entries";
import type { EPABreakdown, TeamStats } from "../stats/stats";

export interface TeamData {
  teamNumber: number;
  year?: number;
  eventCode?: string;
  matchEntries: MatchEntry[];
  pitEntry: PitEntry | null;
  stats: TeamStats | null;
  epa: EPABreakdown | null;
  matchCount: number;
}

export interface TeamWithImages {
  key: string;
  team_number: number;
  nickname: string;
  name: string;
  school_name: string;
  city: string;
  state_prov: string;
  country: string;
  address: string;
  postal_code: string;
  gmaps_place_id: string;
  gmaps_url: string;
  lat: number;
  lng: number;
  location_name: string;
  website: string;
  rookie_year: number;
  images: string[];
}
