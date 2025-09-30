// Types for Nexus API based on OpenAPI specification

export type EventKey = string;

export type PitAddress = string;

export interface PitAddresses {
  [teamNumber: string]: PitAddress;
}

export interface EventSummary {
  name: string;
  start: number;
  end: number;
}

export interface Events {
  [eventKey: string]: EventSummary;
}

export interface MapSize {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface MapElement {
  position: Position;
  size: Size;
  angle?: number;
}

export interface Pit {
  teamNumber?: string;
  label?: string;
  elements: MapElement[];
}

export interface Area {
  label?: string;
  elements: MapElement[];
}

export interface Label {
  text: string;
  position: Position;
  angle?: number;
}

export interface Arrow {
  from: Position;
  to: Position;
}

export interface Wall {
  elements: MapElement[];
}

export interface PitMap {
  size: MapSize;
  pits: Pit[];
  areas: Area[];
  labels: Label[];
  arrows: Arrow[];
  walls: Wall[];
}

export type Teams = (string | null)[];

export interface Times {
  estimatedQueueTime?: number;
  estimatedOnDeckTime?: number;
  estimatedOnFieldTime?: number;
  estimatedStartTime?: number;
}

export interface Match {
  label: string;
  status: string;
  redTeams: Teams;
  blueTeams: Teams;
  times: Times;
  replayOf?: string;
}

export interface Announcement {
  id: string;
  announcement: string;
  postedAt: number;
}

export interface PartsRequest {
  id: string;
  requestedByTeam: string;
  parts: string;
  requestedAt: number;
}

export interface EventStatus {
  eventKey: EventKey;
  dataAsOfTime: number;
  nowQueuing: string | null;
  matches: Match[];
  announcements: Announcement[];
  partsRequests: PartsRequest[];
}

export interface MatchStatus {
  eventKey: EventKey;
  dataAsOfTime: number;
  match: Match;
}