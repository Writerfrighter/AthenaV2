import { fetchJSON } from "../fetcher";

export type Team = { id: string; name: string };
export type TeamImage = { url: string };

const BASE = "https://frc.nexus/api/v1/";
const AUTH_KEY = process.env.NEXUS_API_KEY!;

async function getFromNexus<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  return fetchJSON<T>(url, {
    headers: { "Nexus-Api-Key": AUTH_KEY },
  });
}

export async function getEventMap(eventKey: string): Promise<any> {
  return getFromNexus(`event/${eventKey}/map`);
}
