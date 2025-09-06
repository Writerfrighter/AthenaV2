'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Event } from '@/lib/shared-types';
import { useGameConfig } from '@/hooks/use-game-config';

interface EventContextType {
  events: Event[];
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event) => void;
  setEvents: (events: Event[]) => void;
  isLoading: boolean;
  error: string | null;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const { currentYear } = useGameConfig();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEvent, setSelectedEventState] = useState<Event | null>(null);

  // Fetch events from TBA API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/tba/team/${492}/events/${currentYear}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        
        const tbaEvents = await response.json();
        
        // Transform TBA events to our Event format
        const transformedEvents: Event[] = tbaEvents.map((tbaEvent: any) => ({
          name: tbaEvent.name,
          region: `${tbaEvent.event_code.toUpperCase()}: ${tbaEvent.year}`,
          code: tbaEvent.key,
        }));
        
        setEvents(transformedEvents);
      } catch (err) {
        console.error('Error fetching events from TBA:', err);
        setError('Failed to load events from The Blue Alliance');
        // Fallback to empty array
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [currentYear]);

  // Load selected event from localStorage on mount
  useEffect(() => {
    // Only set selected event after events have been loaded
    if (isLoading || events.length === 0) return;
    
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
  }, [events, isLoading]);

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
    isLoading,
    error,
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
