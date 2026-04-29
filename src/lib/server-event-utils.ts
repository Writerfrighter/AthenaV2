import { cookies } from "next/headers";
import { getTeamEvents } from "./api/tba";
import type { Event } from "./types";

// Server-side function to get the selected event
export async function getSelectedEvent(): Promise<Event> {
  const cookieStore = await cookies();
  const selectedEventCookie = cookieStore.get("selectedEvent");

  const defaultEvent: Event = {
    name: "Loading Events...",
    eventCode: "Please wait",
    region: "",
  };

  if (!selectedEventCookie) {
    return defaultEvent;
  }

  try {
    const savedEvent = JSON.parse(selectedEventCookie.value);
    // Validate the saved event has the required fields
    if (savedEvent.name && savedEvent.region && savedEvent.eventCode) {
      return savedEvent;
    }
  } catch (error) {
    console.error("Error parsing selected event cookie:", error);
  }

  return defaultEvent;
}

// All available events
export async function getAllEvents(): Promise<Event[]> {
  try {
    const tbaEvents = await getTeamEvents(492, 2025); // Default to current year

    return tbaEvents.map((event) => ({
      name: event.name,
      eventCode: `${event.event_code.toUpperCase()}: ${event.year}`,
      region: event.city
        ? `${event.city}, ${event.state_prov || event.country}`
        : "Unknown Region",
    }));
  } catch (error) {
    console.error("Error fetching events from TBA:", error);
    // Fallback to empty array
    return [];
  }
}
