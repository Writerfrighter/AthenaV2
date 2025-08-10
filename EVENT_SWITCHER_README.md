# Event Switcher Implementation

## Overview

The event switcher is now fully functional and affects the entire application. Users can switch between events, and their selection will persist across page reloads and browser sessions.

## Key Features

### 1. Persistent Event Selection
- Selected event is stored in localStorage
- Persists across browser sessions
- Automatically restores on page load

### 2. Global Event Context
- All components can access the selected event via hooks
- Real-time updates when event changes
- Centralized event management

### 3. Database Integration
- All scouting data (pit & match) includes event information
- Data can be filtered by event
- Easy to separate data between different events

## How to Use

### As a User
1. Click on the event switcher in the sidebar
2. Select your desired event from the dropdown
3. The selection will automatically persist and affect all scouting data

### As a Developer

#### Accessing the Selected Event
```tsx
import { useSelectedEvent } from '@/hooks/use-event-config';

function MyComponent() {
  const selectedEvent = useSelectedEvent();
  
  if (selectedEvent) {
    console.log(`Current event: ${selectedEvent.name} (${selectedEvent.number})`);
  }
  
  return <div>Current Event: {selectedEvent?.name}</div>;
}
```

#### Managing Events
```tsx
import { useEventConfig } from '@/hooks/use-event-config';

function EventManager() {
  const { events, selectedEvent, setSelectedEvent, setEvents } = useEventConfig();
  
  // Switch to a different event
  const switchEvent = (newEvent) => {
    setSelectedEvent(newEvent);
  };
  
  // Add new events
  const addEvents = (newEvents) => {
    setEvents([...events, ...newEvents]);
  };
  
  return (
    // Your component JSX
  );
}
```

#### Filtering Data by Event
```tsx
import { useEventFilter } from '@/hooks/use-event-config';

function DataDisplay() {
  const { filterByEvent } = useEventFilter();
  const [allData, setAllData] = useState([]);
  
  // Filter data to only show current event
  const currentEventData = filterByEvent(allData);
  
  return (
    <div>
      {currentEventData.map(item => (
        <div key={item.id}>{item.teamNumber} - {item.eventName}</div>
      ))}
    </div>
  );
}
```

## Implementation Details

### Database Schema
Both `PitEntry` and `MatchEntry` now include:
- `eventName?: string` - The display name of the event
- `eventCode?: string` - The event code/identifier

### Event Context Provider
Located in `src/hooks/use-event-config.tsx`, this provides:
- Event list management
- Selected event state
- Persistence to localStorage
- Utility functions for filtering

### Components Updated
1. **EventSwitcher** - Now uses context instead of props
2. **Dashboard** - Shows selected event in header and info card
3. **Pit Scouting** - Includes event badge and saves event data
4. **Match Scouting** - Includes event badge and saves event data
5. **App Sidebar** - Simplified to use context

## Adding New Events

To add new events, you can either:

1. **Programmatically** (recommended for API integration):
```tsx
const { setEvents } = useEventConfig();
setEvents([
  { name: "New Event", number: "2025code" },
  // ... other events
]);
```

2. **Update the default events** in `use-event-config.tsx`:
```tsx
const [events, setEvents] = useState<Event[]>([
  { name: "District Championships", number: "PNW: 2025" },
  { name: "Your New Event", number: "Your Code" },
  // ... more events
]);
```

## Future Enhancements

1. **API Integration**: Connect to TBA or other APIs to fetch events
2. **Event Logos**: Add logo support (already prepared in interfaces)
3. **Event Details**: Add more metadata (location, dates, etc.)
4. **Multi-Year Events**: Support for same event across multiple years
5. **Event Search**: Add search functionality for large event lists

The event switcher is now fully functional and ready for production use!
