import { cookies } from 'next/headers';
import { getTeamEvents } from './api/tba';

export interface ServerEvent {
  name: string;
  number: string;
  code: string;
}

// Server-side function to get the selected event
export async function getSelectedEvent(): Promise<ServerEvent> {
  const cookieStore = await cookies();
  const selectedEventCookie = cookieStore.get('selectedEvent');
  
  const defaultEvent: ServerEvent = {
    name: "Loading Events...",
    number: "Please wait", 
    code: "",
  };

  if (!selectedEventCookie) {
    return defaultEvent;
  }

  try {
    const savedEvent = JSON.parse(selectedEventCookie.value);
    // Validate the saved event has the required fields
    if (savedEvent.name && savedEvent.number && savedEvent.code) {
      return savedEvent;
    }
  } catch (error) {
    console.error('Error parsing selected event cookie:', error);
  }

  return defaultEvent;
}

// All available events
export async function getAllEvents(): Promise<ServerEvent[]> {
  try {
    const tbaEvents = await getTeamEvents(492, 2025); // Default to current year
    
    return tbaEvents.map(event => ({
      name: event.name,
      number: `${event.event_code.toUpperCase()}: ${event.year}`,
      code: event.key,
    }));
  } catch (error) {
    console.error('Error fetching events from TBA:', error);
    // Fallback to empty array
    return [];
  }
}
