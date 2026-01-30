# Picklist Frontend Integration Guide

## Overview
The picklist system has been fully integrated into the dashboard with event-specific configuration, FRC/FTC support, and comprehensive note management.

## Page Location
**Path**: `src/app/dashboard/picklist/page.tsx`

## Features Implemented

### 1. Event Selection Required
- Shows friendly message when no event is selected
- Displays current event name, competition type, and year in badges
- Automatically loads picklist data for selected event

### 2. Competition Type Support

#### FRC Mode
- **Two view modes**:
  - **Standard View**: Tabbed interface (Pick 1 / Pick 2)
  - **Drag & Drop**: Side-by-side lists with drag-between functionality
- Toggle buttons in page header to switch between views
- Both views support full CRUD operations

#### FTC Mode
- Single picklist view (no pick1/pick2 distinction)
- Standard tabbed interface without view toggle
- All note management features available

### 3. Initial Rankings
- Automatically fetches TBA/FIRST FTC qualification rankings
- Creates picklist entries from EPA/OPR data
- Persists to database on first save
- Subsequent loads pull from database

### 4. Team Notes Integration
- Click any team to view pit/match scouting notes
- Add picklist-specific notes per team
- Notes are tied to picklist entry + team number
- Creator attribution and timestamps

### 5. Permission Checks
- **VIEW_PICKLIST**: Required to view picklists
- **EDIT_PICKLIST**: Required to modify picklists, entries, or notes
- Permission validation in API routes and components

## Component Architecture

```
PicklistPage (src/app/dashboard/picklist/page.tsx)
├── Event Check (displays message if no event selected)
├── Header Section
│   ├── Title and description
│   ├── Event badges (name, competition type, year)
│   └── View mode toggle (FRC only)
└── Content Section
    ├── FRC Draggable Mode → DraggablePicklist component
    ├── FRC Standard Mode → PicklistConfig component
    └── FTC Mode → PicklistConfig component
```

## Components Used

### PicklistConfig
**Path**: `src/components/picklist/picklist-config.tsx`

**Features**:
- Tab-based interface (Pick 1, Pick 2, Main)
- Team selection with expandable details
- Note viewer dialog with all pit/match notes
- Picklist note editor (create/edit/delete)
- Add teams from unassigned pool
- Remove teams from picklist
- Reorder with drag handles

**Props**:
```typescript
{
  eventCode: string;      // e.g., "2025wabe"
  year: number;           // e.g., 2025
  competitionType: 'FRC' | 'FTC';
}
```

### DraggablePicklist
**Path**: `src/components/picklist/draggable-picklist.tsx`

**Features**:
- Side-by-side lists (Pick 1 | Pick 2)
- Drag teams between lists
- Visual feedback during drag
- Auto-save on reorder
- Team cards with basic info

**Props**:
```typescript
{
  eventCode: string;
  year: number;
  competitionType: 'FRC';  // Only for FRC
}
```

## Data Flow

### Initial Load
1. User navigates to `/dashboard/picklist`
2. Page checks for selected event (from `useEventConfig()`)
3. If event exists, loads competition type (from `useGameConfig()`)
4. Component renders with appropriate view
5. Component calls `usePicklist()` hook
6. Hook fetches initial data:
   - If picklist exists in DB → Load from database
   - If no picklist → Fetch TBA/FIRST FTC rankings → Create entries

### Updates
1. User drags team or clicks reorder
2. Component calls `updatePicklistOrder()` from hook
3. Hook sends PUT request to `/api/database/picklist`
4. API route validates permissions
5. Database service updates entry ranks
6. Hook updates local state
7. Toast notification confirms success

### Notes
1. User clicks team in list
2. Component fetches notes via `getTeamNotes(teamNumber)`
3. Hook calls `/api/database/picklist/notes?picklistId=X&teamNumber=Y`
4. Dialog displays pit/match notes (read-only) + picklist notes (editable)
5. User adds note → `addNote()` → POST to API → DB insert
6. User deletes note → `deleteNote()` → DELETE to API → DB remove

## Hooks Used

### useEventConfig()
**Path**: `src/hooks/use-event-config.tsx`

**Returns**:
```typescript
{
  selectedEvent: { code: string; name: string } | null;
}
```

### useGameConfig()
**Path**: `src/hooks/use-game-config.tsx`

**Returns**:
```typescript
{
  currentYear: number;
  competitionType: 'FRC' | 'FTC';
}
```

### usePicklist()
**Path**: `src/hooks/use-picklist.tsx`

**Full API** (see PICKLIST_USAGE_EXAMPLES.md for details):
- State: `picklist`, `entries`, `notes`, `loading`, `error`
- Actions: `createPicklist()`, `updatePicklistOrder()`, `addNote()`, etc.

## UI Components

All components use shadcn/ui primitives:
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Badge` - for team numbers, event info, competition type
- `Button` - for view toggle, actions
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - for pick1/pick2 navigation
- `Dialog`, `DialogTrigger`, `DialogContent` - for note viewer
- `Textarea` - for note editor
- Icons: `Trophy`, `TrendingUp`, `List`, `GripVertical`

## Styling
- Consistent with existing dashboard pages
- Uses theme variables from `globals.css`
- Responsive layout (works on mobile/tablet)
- Loading states with skeleton loaders
- Error states with retry buttons

## Permission Requirements

Users must have appropriate permissions to access features:

| Feature | Permission | Behavior if Missing |
|---------|-----------|---------------------|
| View picklist page | `VIEW_PICKLIST` | Redirect or error message |
| Create picklist | `EDIT_PICKLIST` | Button disabled |
| Reorder teams | `EDIT_PICKLIST` | Drag disabled |
| Add/remove teams | `EDIT_PICKLIST` | Buttons hidden |
| Add notes | `EDIT_PICKLIST` | Note editor hidden |
| Delete notes | `EDIT_PICKLIST` | Delete button hidden |

## Testing Checklist

### FRC Testing
- [ ] Create new event picklist
- [ ] Verify initial rankings from TBA
- [ ] Drag team in Pick 1 list (standard view)
- [ ] Drag team in Pick 2 list (standard view)
- [ ] Switch to drag & drop view
- [ ] Drag team from Pick 1 to Pick 2
- [ ] Drag team from Pick 2 to Pick 1
- [ ] Click team to view notes
- [ ] Add picklist note
- [ ] Edit existing note
- [ ] Delete note
- [ ] Add team from unassigned pool
- [ ] Remove team from picklist
- [ ] Refresh page - verify persistence

### FTC Testing
- [ ] Create new event picklist
- [ ] Verify initial rankings from FIRST FTC
- [ ] Reorder teams in main list
- [ ] Click team to view notes
- [ ] Add picklist note
- [ ] Verify no Pick 1/Pick 2 options shown
- [ ] Refresh page - verify persistence

### Permission Testing
- [ ] Login without VIEW_PICKLIST → verify blocked
- [ ] Login without EDIT_PICKLIST → verify read-only
- [ ] Login with all permissions → verify full access

## Known Limitations

1. **Real-time sync**: Changes don't sync across browser tabs automatically
2. **Undo/redo**: No undo stack for order changes
3. **Bulk operations**: No multi-select for bulk add/remove
4. **History tracking**: No audit log of changes
5. **Search/filter**: No search within picklist (planned enhancement)

## Future Enhancements

- [ ] Real-time collaboration with WebSockets
- [ ] Drag-and-drop file import for picklists
- [ ] Export picklist to CSV/PDF
- [ ] Compare picklists across events
- [ ] Team availability indicator (if scouted)
- [ ] Integration with match schedule predictions
- [ ] Mobile-optimized drag interface

## Related Documentation

- **System Architecture**: `PICKLIST_SYSTEM.md`
- **Database Schema**: `PICKLIST_DATABASE_SCHEMA.sql`
- **API Documentation**: `PICKLIST_README.md`
- **Usage Examples**: `PICKLIST_USAGE_EXAMPLES.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
