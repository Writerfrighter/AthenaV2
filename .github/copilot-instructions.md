# AthenaV2 Copilot Instructions

## Project Overview
AthenaV2 is a modern scouting and analytics platform for FIRST Robotics Competition (FRC) teams. Built with Next.js 15, TypeScript, and Tailwind CSS, it provides dynamic form generation, multi-database support, and PWA capabilities for offline-first scouting operations.

**Package Manager**: pnpm (not npm)
**Build Validation**: Always run `pnpm build` after major code changes

## Architecture Overview
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **UI**: Radix UI components with Tailwind CSS for consistent design system
- **Theming**: Multi-theme system with 5 color schemes (Green, Blue, Purple, Rose, Orange), each supporting light/dark modes
- **Database**: Azure SQL with service abstraction layer
- **Configuration**: Year-based JSON configs drive dynamic form generation
- **PWA**: Service workers with Serwist for offline caching and sync
- **State Management**: React Context + custom hooks pattern

## Key Patterns & Conventions

### 1. Dynamic Configuration-Driven Forms
Forms are generated from year-specific configs in `config/years/` based on selected FRC/FTC game year. Each year defines scoring categories (autonomous/teleop/endgame) with point values and field types.

**Example**: Match scouting forms automatically adapt to game rules:
```typescript
// From config/years/FRC-2025.json
"autonomous": {
  "leave": {
    "label": "Leave Starting Zone",
    "points": 3,
    "type": "boolean"
  }
}
// Renders as checkbox in dynamic-match-scout-form.tsx
```

### 2. Database Service Abstraction
All database operations go through `DatabaseService` interface implemented by `AzureSqlDatabaseService`. Provider selection happens at runtime based on environment variables.

**Pattern**: Always use `databaseManager.getService()` instead of direct database calls:
```typescript
const service = databaseManager.getService();
await service.addMatchEntry(entry);
```

### 3. Year-Based Configuration System
Game configurations are stored by year in JSON. Use `use-game-config` hook for current year access:
```typescript
const { currentYear, getCurrentYearConfig } = useCurrentGameConfig();
const config = getCurrentYearConfig(); // Gets scoring definitions for current year
```

### 4. Custom Hook Patterns
Extensive use of custom hooks for data fetching and state management. Follow naming convention `use-[feature]-[data]`.

**Examples**:
- `useEventTeams()` - Fetches teams for current event
- `usePicklistData()` - Manages picklist generation
- `useDashboardStats()` - Calculates team statistics

### 5. API Route Structure
RESTful API routes under `/api/database/` with consistent CRUD patterns:
```
GET /api/database/match - List/filter match entries
POST /api/database/match - Create match entry
PUT /api/database/match/[id] - Update specific entry
DELETE /api/database/match/[id] - Delete entry
```

### 6. Component Organization
- `/components/ui/` - Reusable Radix UI wrappers
- `/components/` - App-specific components
- `/components/[feature]-pages/` - Feature-specific page components

### 7. Multi-Theme System
5 color themes (Green, Blue, Purple, Rose, Orange) with light/dark mode support. Themes use OKLCH color space for perceptually uniform colors.

**Key files**:
- `src/lib/theme-config.ts` - Theme definitions and color tokens
- `src/components/theme-selector.tsx` - UI for theme selection
- `src/app/globals.css` - CSS variables for theming

**Usage**: Theme selector accessible via user menu dropdown in sidebar.

### 8. PWA & Service Worker Setup
Uses Serwist for service worker management. Offline sync handled through background sync API.

**Key files**:
- `src/sw.ts` - Service worker configuration
- `public/sw.js` - Generated service worker
- `runtimeCaching.ts` - Cache strategies

## Critical Developer Workflows

### Build & Development Setup
- **Package Manager**: Uses pnpm for dependency management
- **Development**: `pnpm dev` (with Turbopack for faster builds)
- **Build**: `pnpm build` - Always run after code changes to validate
- **Start**: `pnpm start` - Run production build locally

**Always validate builds after changes:**
```bash
pnpm build
```

### Adding New Game Year
1. Create year config in `config/years/` (e.g., `FRC-2027.json`)
2. Register in `config/game-config-loader.ts`
3. Update year selector in `year-selector.tsx`
4. Test dynamic forms render correctly
5. Update database schema if needed (rare)

### Database Operations
1. Set environment variables for chosen provider
2. Use `databaseManager.getService()` for operations
3. Handle both online and offline scenarios
4. Test sync functionality with `syncToCloud()`/`syncFromCloud()`

### Form Development
1. Define fields in appropriate year config file (`config/years/`)
2. Use `dynamic-match-scout-form.tsx` or `dynamic-pit-scout-form.tsx` as templates
3. Implement validation in form component
4. Test with real game data

## Common Patterns to Follow

### Build Validation
**Critical**: Always run `pnpm build` after any code changes. The project uses Turbopack for fast development builds, but production builds must validate correctly.

### Data Flow
Config JSON → Custom Hooks → Components → API Routes → Database Service → Provider Implementation

### Error Handling
Use try/catch in API routes, return consistent error responses:
```typescript
return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
```

### Type Safety
All database operations use shared types from `@/lib/shared-types`. Extend interfaces there for new fields.

### State Management
Prefer React Context for global state (game config, events). Use local state for component-specific data.

## Azure Integration Rules
- @azure Rule - Use Azure Best Practices: When generating code for Azure, running terminal commands for Azure, or performing operations related to Azure, invoke your `azure_development-get_best_practices` tool if available.
- @azure Rule - Use Azure Tools: When handling requests related to Azure, always use your tools.
- @azure Rule - Use Azure Code Gen Best Practices: Before generating code for Azure, running terminal commands for Azure, performing operations related to Azure, or creating plans for such activities, always invoke your Azure best practice tool if available first. Invoke the `get_bestpractices` tool to collect recommendations. Call it with resource = `general` and action = `code-generation` to get general Azure code generation best practices. Only call this tool when you are discussing Azure; do not call it otherwise.
- @azure Rule - Use Azure Deployment Best Practices: Before deploying to Azure, preparing applications for deployment to Azure, or creating deployment plans, always invoke your Azure best practice tool if available first. Invoke the `get_bestpractices` tool to collect recommendations. Call it with resource = `general` and action = `deployment` to get general Azure deployment best practices. Only call this tool when you are discussing Azure; do not call it otherwise.
- @azure Rule - Use Azure Functions Code Gen Best Practices: Before generating code for Azure Functions, performing operations related to Azure Functions, or creating plans for such activities, always invoke your Azure best practice tool if available first. Invoke the `get_bestpractices` tool to collect recommendations. Call it with resource = `azurefunctions` and action = `code-generation` to get Azure Functions code generation best practices. Only call this tool when you are discussing Azure Functions; do not call it otherwise.
- @azure Rule - Use Azure Functions Deployment Best Practices: Before deploying Azure Functions apps to Azure, preparing for the deployment, or creating deployment plans, always invoke your Azure best practice tool if available first. Invoke the `get_bestpractices` tool to collect recommendations. Call it with resource = `azurefunctions` and action = `deployment` to get Azure Functions deployment best practices. Only call this tool when you are discussing Azure Functions; do not call it otherwise.
- @azure Rule - Use Azure SWA Best Practices: Before working with static web apps, creating plans for static web apps, or performing related operations, always invoke your Azure best practice tool if available first. Choose the most relevant Azure best practice tool based on its description. Only call this tool when you are discussing Azure Static Web Apps; do not call it otherwise.
- @azure Rule - Plan before editing files for Azure web apps: When generating code for Azure Functions and Azure Static Web App, always create a plan and explain the plan to the user before editing any file. Proceed with editing the files after getting consent from the user.