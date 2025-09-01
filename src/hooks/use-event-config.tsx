'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Event } from '@/lib/shared-types';

interface EventContextType {
  events: Event[];
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event) => void;
  setEvents: (events: Event[]) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  // Default events - these could come from an API or config file in the future
  const [events, setEvents] = useState<Event[]>([
    {
      name: "District Championships",
      region: "PNW: 2025",
      code: "2025pncmp",
    },
    {
      name: "District Sammamish Event", 
      region: "PNW: 2025",
      code: "2025wasam",
    },
    {
      name: "District Sundome Event",
      region: "PNW: 2025", 
      code: "2025wayak",
    },
  ]);

  const [selectedEvent, setSelectedEventState] = useState<Event | null>(null);

  // Load selected event from localStorage on mount
  useEffect(() => {
    const savedEvent = localStorage.getItem('selectedEvent');
    if (savedEvent) {
      try {
        const parsedEvent = JSON.parse(savedEvent);
        // Verify the saved event still exists in the events list
        const eventExists = events.find(e => 
          (e.name === parsedEvent.name || e.region === parsedEvent.region || e.code === parsedEvent.code)
        );
        if (eventExists) {
          setSelectedEventState(parsedEvent);
        } else {
          // If saved event doesn't exist anymore, default to first event
          setSelectedEventState(events[0] || null);
        }
      } catch (error) {
        console.error('Error parsing saved event:', error);
        setSelectedEventState(events[0] || null);
      }
    } else {
      // No saved event, default to first event
      setSelectedEventState(events[0] || null);
    }
  }, [events]);

  // Save selected event to localStorage and cookies whenever it changes
  useEffect(() => {
    if (selectedEvent) {
      localStorage.setItem('selectedEvent', JSON.stringify(selectedEvent));
      // Also set a cookie for server-side access
      document.cookie = `selectedEvent=${encodeURIComponent(JSON.stringify(selectedEvent))}; path=/; max-age=${60 * 60 * 24 * 30}`; // 30 days
    }
  }, [selectedEvent]);

  const setSelectedEvent = (event: Event) => {
    setSelectedEventState(event);
  };

  const contextValue: EventContextType = {
    events,
    selectedEvent,
    setSelectedEvent,
    setEvents,
  };

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
}

export function useEventConfig() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEventConfig must be used within an EventProvider');
  }
  return context;
}

export function useSelectedEvent() {
  const { selectedEvent } = useEventConfig();
  return selectedEvent;
}

// Utility function to filter data by selected event
export function useEventFilter() {
  const { selectedEvent } = useEventConfig();
  
  const filterByEvent = <T extends { eventName?: string; eventCode?: string }>(data: T[]): T[] => {
    if (!selectedEvent) return data;
    
    return data.filter(item => 
      item.eventName === selectedEvent.name || 
      item.eventCode === selectedEvent.region ||
      item.eventCode === selectedEvent.code
    );
  };
  
  return { filterByEvent, selectedEvent };
}
