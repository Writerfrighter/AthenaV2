'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Event } from '@/lib/shared-types';
import { useGameConfig } from '@/hooks/use-game-config';
import { TbaEvent } from '@/lib/api/tba-types';
import { FtcEvent } from '@/lib/api/ftcevents-types';
import type { CustomEvent } from '@/lib/shared-types';

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
  const { currentYear, competitionType, isInitialized } = useGameConfig();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEvent, setSelectedEventState] = useState<Event | null>(null);

  // Fetch events from TBA API and custom events
  useEffect(() => {
    // Don't fetch until game config is initialized
    if (!isInitialized) return;

    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch TBA events (only for FRC, as TBA doesn't support FTC)
        let tbaEvents: Event[] = [];
        if (competitionType === 'FRC') {
          try {
            const teamNumber = 492; // FRC team number
            const tbaResponse = await fetch(`/api/tba/team/${teamNumber}/events/${currentYear}`);
            if (tbaResponse.ok) {
              const tbaEventData = await tbaResponse.json();

              // Transform TBA events to our Event format
              tbaEvents = tbaEventData.map((tbaEvent: TbaEvent) => ({
                name: tbaEvent.name,
                region: `${tbaEvent.event_code.toUpperCase()}: ${tbaEvent.year}`,
                code: tbaEvent.key,
              }));
            }
          } catch (tbaError) {
            console.warn('Failed to fetch TBA events, continuing with custom events only:', tbaError);
          }
        } else if (competitionType === 'FTC') {
          // Fetch FTC events
          try {
            const teamNumber = 3543; // FTC team number
            const ftcResponse = await fetch(`/api/ftc/team/${teamNumber}/events/${currentYear}`);
            if (ftcResponse.ok) {
              const ftcEventData = await ftcResponse.json();

              // Transform FTC events to our Event format
              tbaEvents = ftcEventData.map((ftcEvent: FtcEvent) => ({
                name: ftcEvent.name || 'Unknown Event',
                region: `${ftcEvent.city || ''}${ftcEvent.city && ftcEvent.stateprov ? ', ' : ''}${ftcEvent.stateprov || ''}` || ftcEvent.typeName || 'FTC Event',
                code: ftcEvent.code || ftcEvent.eventId,
              }));
            }
          } catch (ftcError) {
            console.warn('Failed to fetch FTC events, continuing with custom events only:', ftcError);
          }
        }

        // Fetch custom events
        let customEvents: Event[] = [];
        try {
          const customResponse = await fetch(`/api/database/custom-events?year=${currentYear}`);
          if (customResponse.ok) {
            const customEventData = await customResponse.json();

            // Transform custom events to our Event format
            customEvents = customEventData.map((customEvent: CustomEvent) => ({
              name: customEvent.name,
              region: customEvent.location ? `${customEvent.location}${customEvent.region ? ', ' + customEvent.region : ''}` : `Custom Event: ${customEvent.year}`,
              code: customEvent.eventCode,
            }));
          }
        } catch (customError) {
          console.warn('Failed to fetch custom events:', customError);
        }

        // Combine TBA and custom events
        const allEvents = [...tbaEvents, ...customEvents];
        setEvents(allEvents);

        if (allEvents.length === 0) {
          setError('No events found for this year');
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events');
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [currentYear, competitionType, isInitialized]);

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
