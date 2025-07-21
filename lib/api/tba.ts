import { fetchJSON } from "../fetcher";

export type Team = { id: string; name: string };
export type TeamImage = { url: string };

const BASE = "https://api.thebluealliance.com/api/v3/";
const AUTH_KEY = process.env.TBA_API_KEY!;

async function getFromTba<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  return fetchJSON<T>(url, {
    headers: { "X-TBA-Auth-Key": AUTH_KEY },
  });
}

/** 1. API Status **/
export interface TbaStatus {
  is_datafeed_down: boolean;
}
export function getStatus(): Promise<TbaStatus> {
  return getFromTba<TbaStatus>("status");
}

/** 2. Events for a Team **/
export interface TbaEventSimple {
  key: string;
  name: string;
  start_date: string;
  end_date: string;
}
export function getTeamEvents(
  teamNumber: number,
  season: number
): Promise<TbaEventSimple[]> {
  return getFromTba(`team/frc${teamNumber}/events/${season}/simple`);
}
export async function getTeamEventNames(
  teamNumber: number,
  season: number
): Promise<Array<[string, string]>> {
  const events = await getTeamEvents(teamNumber, season);
  return events.map((e) => [e.name, e.key]);
}
export async function getTeamEventDateMap(
  teamNumber: number,
  season: number
): Promise<Record<string, string>> {
  const events = await getTeamEvents(teamNumber, season);
  return Object.fromEntries(events.map((e) => [e.start_date, e.key]));
}

/** 3. Teams at an Event **/
export interface TbaTeamSimple {
  key: string;
  team_number: number;
  nickname: string;
}
export async function getEventTeams(eventKey: string): Promise<number[]> {
  const teams = await getFromTba<TbaTeamSimple[]>(
    `event/${eventKey}/teams/simple`
  );
  return teams.map((t) => t.team_number);
}
export async function getEventTeamsInfo(
  eventKey: string
): Promise<Record<string, { nickname: string; team_number: number }>> {
  const teams = await getFromTba<TbaTeamSimple[]>(
    `event/${eventKey}/teams/simple`
  );
  return Object.fromEntries(
    teams.map((t) => [
      t.key,
      { nickname: t.nickname, team_number: t.team_number },
    ])
  );
}
export async function getEventTeamNumberMap(
  eventKey: string
): Promise<Record<string, string>> {
  const teams = await getFromTba<TbaTeamSimple[]>(
    `event/${eventKey}/teams/simple`
  );
  return Object.fromEntries(
    teams.map((t) => [String(t.team_number), t.nickname])
  );
}

/** 4. Single Event Data **/
export function getEventDetails(eventCode: string): Promise<any> {
  return getFromTba(`event/${eventCode}`);
}
export function getEventSummary(eventCode: string): Promise<TbaEventSimple> {
  return getFromTba(`event/${eventCode}/simple`);
}
export function getEventOprs(eventCode: string): Promise<any> {
  return getFromTba(`event/${eventCode}/oprs`);
}
export async function getCurrentEventForTeam(
  teamNumber: number
): Promise<TbaEventSimple | {}> {
  const year = new Date().getFullYear();
  const events = await getFromTba<TbaEventSimple[]>(
    `team/frc${teamNumber}/events/${year}`
  );
  const today = new Date().toISOString().slice(0, 10);
  return events.find((e) => e.start_date <= today && e.end_date >= today) ?? {};
}
export async function getEventDateRange(eventCode: string): Promise<string> {
  const e = await getEventSummary(eventCode);
  return `${e.start_date} ${e.end_date}`;
}

/** 5. Matches **/
export interface TbaMatchSimple {
  comp_level: string;
  match_number: number;
  key: string;
}
export async function getTeamMatchesForEvent(
  teamNumber: number,
  eventCode: string
): Promise<TbaMatchSimple[]> {
  const year = new Date().getFullYear();
  const key = `${year}${eventCode}`;
  const matches = await getFromTba<TbaMatchSimple[]>(
    `team/frc${teamNumber}/event/${key}/matches/simple`
  );
  return matches.sort((a, b) =>
    a.comp_level === "qm" && b.comp_level !== "qm"
      ? -1
      : b.comp_level === "qm" && a.comp_level !== "qm"
      ? 1
      : a.match_number - b.match_number
  );
}
export function getEventMatches(eventCode: string): Promise<any[]> {
  return getFromTba(`event/${eventCode}/matches`);
}
export async function getEventRankings(eventCode: string): Promise<any[]> {
  const r = await getFromTba<any>(`event/${eventCode}/rankings`);
  return r.rankings;
}
export function getMatchSummary(matchKey: string): Promise<any> {
  return getFromTba(`match/${matchKey}/simple`);
}
export function getMatchDetails(matchKey: string): Promise<any> {
  return getFromTba(`match/${matchKey}`);
}
export function getMatchMotionworks(matchKey: string): Promise<any> {
  return getFromTba(`match/${matchKey}/zebra_motionworks`);
}

/** 6. Team Info & Media **/
export function getTeamInfo(teamNumber: number): Promise<any> {
  return getFromTba(`team/frc${teamNumber}`);
}
export async function getTeamMedia(teamNumber: number): Promise<string[]> {
  const resp = await getFromTba<any[]>(
    `team/frc${teamNumber}/media/${new Date().getFullYear()}`
  );
  const images: string[] = [];
  for (const item of resp) {
    if (item.type === "imgur" && item.preferred) {
      images.unshift(item.direct_url);
    } else if (item.type === "imgur") {
      images.push(item.direct_url);
    }
    if (images.length >= 3) break;
  }
  return images;
}
