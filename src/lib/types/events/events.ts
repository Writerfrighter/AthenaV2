export type { CustomEvent } from "../db/entries"; // Re-export shared type because it's also an event
export interface Event {
  name: string;
  region?: string;
  eventCode: string;
}
