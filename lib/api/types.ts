export interface TbaStatus {
  is_datafeed_down: boolean;
}

export interface TbaTeamSimple {
  key: string;
  team_number: number;
  nickname: string;
  name: string;
  city: string;
  state_prov: string;
  country: string;
}

/** Team object from TBA API */
export interface TbaTeam {
  key: string; // e.g. "frc492"
  team_number: number; // e.g. 492
  nickname: string; // informal name
  name: string; // full official name
  school_name: string;

  city: string;
  state_prov: string;
  country: string;

  address: string;
  postal_code: string;
  gmaps_place_id: string;
  gmaps_url: string;

  lat: number; // latitude
  lng: number; // longitude
  location_name: string;

  website: string;
  rookie_year: number;
}

/** Match Alliance Info */
export interface TbaAlliance {
  score: number;
  team_keys: string[];
  surrogate_team_keys: string[];
  dq_team_keys: string[];
}

/** Alliance breakdown per year may vary—so use generic fallback */
export type ScoreBreakdownAlliance = Record<string, number | string | boolean>;

/** Overall score breakdown structure (two alliances + extras) */
export interface ScoreBreakdown {
  red: ScoreBreakdownAlliance;
  blue: ScoreBreakdownAlliance;
  [extra: string]: unknown; // e.g. coopertition or shared fields
}

/** Video metadata attached to a match */
export interface TbaMatchVideo {
  type: string;
  key: string;
}

/** Full match object for flexible per-season use */
export interface TbaMatch {
  key: string;
  comp_level: "qm" | "qf" | "sf" | "f";
  set_number: number;
  match_number: number;

  alliances: {
    red: TbaAlliance;
    blue: TbaAlliance;
  };

  winning_alliance: "red" | "blue" | "";
  event_key: string;

  time: number;
  actual_time: number;
  predicted_time: number;
  post_result_time: number;

  score_breakdown: ScoreBreakdown;

  videos: TbaMatchVideo[];
}

/** Simple Match object from TBA API */
export interface TbaMatchSimple {
  key: string;
  comp_level: "qm" | "qf" | "sf" | "f";
  set_number: number;
  match_number: number;

  alliances: {
    red: TbaAlliance;
    blue: TbaAlliance;
  };

  winning_alliance: "red" | "blue" | "";
  event_key: string;

  time: number; // scheduled UNIX timestamp
  predicted_time: number; // predicted UNIX timestamp
  actual_time: number; // actual played time (if available)
}

/** District object returned in an Event */
export interface TbaDistrict {
  abbreviation: string;
  display_name: string;
  key: string;
  year: number;
}

/** Webcast info returned in an Event */
export interface TbaWebcast {
  type: string; // e.g. "youtube"
  channel: string; // channel ID or URL fragment
  date: string; // ISO datetime
  file: string; // optional file path
}

export interface TbaEventSimple {
  key: string;
  name: string;
  event_code: string;
  event_type: number;
  district: TbaDistrict;

  city: string;
  state_prov: string;
  country: string;

  start_date: string; // format: YYYY-MM-DD
  end_date: string; // format: YYYY-MM-DD
  year: number;
}
/** Full Event object returned by GET /event/{event_key} */
export interface TbaEvent {
  key: string;
  name: string;
  event_code: string;
  event_type: number;
  district: TbaDistrict;

  city: string;
  state_prov: string;
  country: string;

  start_date: string; // ISO date: YYYY-MM-DD
  end_date: string; // ISO date: YYYY-MM-DD
  year: number;

  short_name: string;
  event_type_string: string;
  week: number;

  address: string;
  postal_code: string;
  gmaps_place_id: string;
  gmaps_url: string;

  lat: number;
  lng: number;
  location_name: string;
  timezone: string;
  website: string;

  first_event_id: string;
  first_event_code: string;

  webcasts: TbaWebcast[];
  division_keys: string[];
  parent_event_key: string;

  playoff_type: number;
  playoff_type_string: string;
}

/** Metric map: team_key -> score */
export type TbaMetricMap = Record<string, number>;

/** Response from /event/{event_key}/oprs */
export interface TbaOprs {
  oprs: TbaMetricMap;
  dprs: TbaMetricMap;
  ccwms: TbaMetricMap;
}

/** Record of wins, losses, and ties */
export interface TbaRecord {
  wins: number;
  losses: number;
  ties: number;
}

/** Info for each extra stat field */
export interface TbaExtraStatInfo {
  precision: number;
  name: string;
}

/** Info for each sort order field */
export interface TbaSortOrderInfo {
  precision: number;
  name: string;
}

/** Individual team's ranking entry */
export interface TbaRankingItem {
  team_key: string; // e.g. "frc492"
  rank: number; // Overall rank
  dq: number; // Disqualification count
  matches_played: number; // Matches played
  qual_average: number | null; // Optional qualification average
  extra_stats: number[]; // TBA-generated custom stats
  sort_orders: number[] | null; // Optional sort values
  record: TbaRecord | null; // WLT record (may be null)
}

/** Full ranking block for an event */
export interface TbaEventRanking {
  rankings: TbaRankingItem[];
  extra_stats_info: TbaExtraStatInfo[];
  sort_order_info: TbaSortOrderInfo[];
}

/** Media types supported by TBA */
export type MediaType =
  | "youtube"
  | "cdphotothread"
  | "imgur"
  | "facebook-profile"
  | "youtube-channel"
  | "twitter-profile"
  | "github-profile"
  | "instagram-profile"
  | "periscope-profile"
  | "gitlab-profile"
  | "grabcad"
  | "instagram-image"
  | "external-link"
  | "avatar"
  | "onshape";

/** Additional details are highly type-dependent */
export type MediaDetails = Record<string, unknown>; // optional, varies by type

/** Represents a media object on The Blue Alliance */
export interface TbaMedia {
  type: MediaType; // Type of media
  foreign_key: string; // Identifier on host platform (e.g., YouTube ID)
  details?: MediaDetails; // Optional metadata based on media type

  preferred: boolean; // Whether it's high-quality or featured
  team_keys: string[]; // Usually one team (e.g., ["frc492"])

  direct_url: string; // Raw link to the file/image/video
  view_url: string; // Link to media webpage (e.g., YouTube video)
}
