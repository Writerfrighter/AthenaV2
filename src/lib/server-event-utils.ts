import { cookies } from 'next/headers';

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
    name: "District Championships",
    number: "PNW: 2025", 
    code: "2025pncmp",
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
export function getAllEvents(): ServerEvent[] {
  return [
    {
      name: "District Championships",
      number: "PNW: 2025",
      code: "2025pncmp",
    },
    {
      name: "District Sammamish Event", 
      number: "PNW: 2025",
      code: "2025wasam",
    },
    {
      name: "District Sundome Event",
      number: "PNW: 2025", 
      code: "2025wayak",
    },
  ];
}
