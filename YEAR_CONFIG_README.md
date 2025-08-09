# Year-Based Configuration System

## Overview

AthenaV2 now supports year-based configuration for FRC games without requiring database migrations or major code changes. Simply update the JSON configuration file to switch between different game years.

## Configuration

### Game Configuration File
The main configuration is stored in `config/game-config.json`. This file contains:

- **currentYear**: The default year when the app loads
- **years**: Object containing configuration for each FRC season

### Adding a New Year

1. Open `config/game-config.json`
2. Add a new year entry following this structure:

```json
"2026": {
  "gameName": "NEW_GAME_NAME",
  "autonomous": {
    "mobility": true/false,
    "scoring": {
      "scoringMethod1": { "label": "Display Name", "type": "number" },
      "scoringMethod2": { "label": "Display Name", "type": "number" }
    },
    "startPositions": ["Position 1", "Position 2", "Position 3"]
  },
  "teleop": {
    "scoring": {
      "scoringMethod1": { "label": "Display Name", "type": "number" },
      "scoringMethod2": { "label": "Display Name", "type": "number" }
    },
    "gamePieces": { "label": "Game Pieces Collected", "type": "number" }
  },
  "endgame": {
    "positions": ["None", "Position 1", "Position 2"],
    "specialCapability1": true/false,
    "specialCapability2": true/false
  },
  "pitScouting": {
    "drivetrains": ["Swerve", "Mecanum", "Tank", "Other"],
    "autonomousCapabilities": true,
    "customFields": [
      {
        "name": "fieldName",
        "label": "Display Label",
        "type": "select|boolean|text|number",
        "options": ["Option1", "Option2"] // only for select type
      }
    ]
  }
}
```

### Switching Years

Users can switch between years using the YearSelector component in the app header. The selection is saved in localStorage and persists across sessions.

## Database Structure

### Flexible Schema
The database now uses a flexible schema that stores game-specific data in a `gameSpecificData` field:

- **Match Entries**: Core fields (match#, team#, alliance, position) + `gameSpecificData` object
- **Pit Entries**: Core fields (team#, name, dimensions, drivetrain) + `gameSpecificData` object

### Data Storage
- All data includes a `year` field for filtering
- Game-specific scoring and capabilities are stored in `gameSpecificData`
- No database migrations needed when adding new games

## Components

### Dynamic Forms
- `DynamicMatchScoutForm`: Automatically generates match scouting forms based on configuration
- `DynamicPitScoutForm`: Automatically generates pit scouting forms based on configuration
- `DynamicTeamPage`: Shows team analysis with year-specific data and charts

### Year Management
- `YearSelector`: Dropdown to switch between available years
- `useGameConfig`: Hook to access current configuration
- `useCurrentGameConfig`: Hook to get configuration for selected year

## Usage Examples

### Quick Year Setup for 2026
1. Copy the 2025 configuration in the JSON file
2. Update the game name and scoring methods
3. Modify autonomous, teleop, and endgame configurations
4. Add any new pit scouting custom fields
5. Set `currentYear` to 2026
6. Deploy - no code changes needed!

### Accessing Current Configuration in Code
```tsx
import { useCurrentGameConfig } from '@/hooks/use-game-config';

function MyComponent() {
  const gameConfig = useCurrentGameConfig();
  
  // Access current year's autonomous scoring
  const autoScoring = gameConfig.autonomous.scoring;
  
  // Check if game has specific capabilities
  const hasDocking = gameConfig.endgame.docking;
}
```

## Migration from Old System

Existing data will be automatically migrated to include year fields. The database schema is backwards-compatible and will upgrade existing entries on first load.

## Benefits

1. **No Code Changes**: Add new years by editing JSON only
2. **Instant Switching**: Users can analyze any year's data instantly
3. **Preserved History**: All historical data remains accessible
4. **Type Safety**: Full TypeScript support for all configurations
5. **Backwards Compatible**: Existing data is preserved and migrated

This system ensures that AthenaV2 can quickly adapt to new FRC games each year without requiring developer intervention or database updates.
