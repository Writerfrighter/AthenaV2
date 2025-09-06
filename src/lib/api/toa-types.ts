export interface ToaTeam {
  team_key: string;
  region_key: string;
  league_key: string;
  team_number: number;
  team_name_short: string;
  team_name_long: string;
  robot_name: string;
  last_active: number;
  city: string;
  state_prov: string;
  zip_code: number;
  country: string;
  rookie_year: number;
  website: string;
}

export interface ToaEventParticipant {
  event_participant_key: string;
  event_key: string;
  team_key: string;
  is_active: boolean;
  card_status: string;
  team: ToaTeam;
  event: ToaEvent;
  is_league_team: boolean;
  league_team_name: string;
}

export interface ToaRegion {
  region_key: string;
  description: string;
}

export interface ToaEvent {
  event_key: string;
  season_key: string;
  region_key: string;
  league_key: string;
  event_code: string;
  event_type_key: string;
  division_key: number;
  division_name: string;
  event_name: string;
  start_date: string;
  end_date: string;
  week_key: string;
  city: string;
  state_prov: string;
  country: string;
  venue: string;
  website: string;
  time_zone: string;
  is_public: boolean;
  data_source: number;
}

export interface ToaSeason {
  season_key: string;
  description: string;
  is_active: string;
}
