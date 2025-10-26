# Team Pages Directory

This directory contains year and competition-specific team analysis pages that are dynamically loaded based on the current game configuration.

## Naming Convention

Team page components must follow this strict naming convention:

### File naming:
```
{competitionType}-team-{year}-page.tsx
```

### Export naming:
```typescript
export function {CompetitionType}Team{Year}Page({ teamNumber }: TeamPageProps) {
  // Component implementation
}
```

## Examples

### FRC 2025 Page
- **File**: `frc-team-2025-page.tsx`
- **Export**: `export function FRCTeam2025Page({ teamNumber }: Team2025PageProps)`

### FTC 2025 Page (when implemented)
- **File**: `ftc-team-2025-page.tsx`
- **Export**: `export function FTCTeam2025Page({ teamNumber }: TeamPageProps)`

### FRC 2026 Page (when implemented)
- **File**: `frc-team-2026-page.tsx`
- **Export**: `export function FRCTeam2026Page({ teamNumber }: TeamPageProps)`

## Component Props Interface

All team page components must accept these props:

```typescript
interface TeamPageProps {
  teamNumber: string;
}
```

## How It Works

The `team-page-client.tsx` file automatically:
1. Reads the current `competitionType` and `currentYear` from game config
2. Constructs the component filename: `{competitionType.toLowerCase()}-team-{currentYear}-page`
3. Dynamically imports the matching component
4. Falls back to a "not implemented" message if the component doesn't exist

## Adding a New Year/Competition Page

1. Create a new file following the naming convention (e.g., `frc-team-2026-page.tsx`)
2. Export a named function following the export convention (e.g., `FRCTeam2026Page`)
3. Accept the standard `TeamPageProps` interface
4. No need to modify `team-page-client.tsx` - it will automatically pick up the new component!

## Example Template

```typescript
'use client';

import { useTeamData } from '@/hooks/use-team-data';

interface TeamPageProps {
  teamNumber: string;
}

export function FRCTeam2026Page({ teamNumber }: TeamPageProps) {
  const { teamData, loading, error } = useTeamData(teamNumber);

  // Your component implementation
  return (
    <div className="container mx-auto p-6">
      <h1>Team {teamNumber} - FRC 2026</h1>
      {/* Your page content */}
    </div>
  );
}
```
