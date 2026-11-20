# Graph Report - AthenaV2  (2026-11-14)

## Corpus Check
- 464 files · ~228,138 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .css 7, (none) 6, .example 1)

## Summary
- 2896 nodes · 9669 edges · 124 communities (112 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 129 edges (avg confidence: 0.85)
- Token cost: 676,404 input · 0 output

## Community Hubs (Navigation)
- FRC Team Page Charts
- API Route Validation
- FTC Events API Client
- Azure SQL Service
- MariaDB Service
- UI Primitives & Variants
- Dev Dependencies
- Admin & Sync Pages
- Theme & Scouting Pages
- User & Auth Routes
- Container Release Workflow
- First-Run Setup Wizard
- TBA API Client
- Scouting Schema & Architecture
- Sidebar Navigation
- Schedule Assignment Persistence
- Env & Setup Completion
- API Route Test Doubles
- Game Config Studio
- Node Built-ins & Bootstrap
- Azure Deploy Workflow
- Data Tables & Team Mgmt
- SQL Row Mapping
- Picklist & Matchup Cards
- Event Data Routes
- Account & Guest Dialogs
- Dashboard & Match Form
- Import Validation & Year Config
- Database CI Workflow
- Document DB Service
- Dashboard Shell & Auth Types
- Runtime Dependencies
- IndexedDB Cache Writes
- Web Push Notifications
- Analysis Page & EPA Charts
- Picklist Hook & Model
- Offline Queue Manager
- Guest Link Service
- Select & Provider Fields
- IndexedDB Cache Reads
- Game Config Store
- Roles & Permissions
- Service Worker
- Nexus API Client
- Security Workflow
- Analysis & SPR Hooks
- Form Drafts & Pit Form
- Spreadsheet Import Parser
- Cosmos DB Provider
- Firebase Provider
- CI Checks Workflow
- Guest Session Proxy
- Playwright Workflow
- Scouting Entry Routes
- shadcn Components Config
- NextAuth Login Flow
- Team List Pages
- Scout Schedule Page
- Guest Link Persistence
- Document Store Ops
- PWA Manifest & Robots
- TypeScript Config
- Project Docs & Guides
- Rate Limit & Password Auth
- Datapoint Registry
- Onboarding Tour
- Command & Datapoint Picker
- Event Cache Manager
- Scoring Statistics
- Image Carousel
- Root Layout & Toaster
- Field Drawing Canvas
- Confirm Dialogs & Submit
- Custom Events & Accounts
- Deployment Docs
- Health & Colors Routes
- Provider Options Setup
- pnpm Workspace
- Database Manager
- Dashboard Stats Client
- Offline Sync Engine
- Session & Guest Boundary
- Year Config Loader
- useOffline Hook
- Document DB Lifecycle
- Document DB Tests
- Scouting Entries Hook
- Matchup Probability
- Sheet Component
- Schedule Data Hook
- Game Config Context
- Rebuilt Field Map
- Match Scouting Screenshot
- API Keys Service
- Fake IndexedDB Tests
- Docker Compose
- Next Config & Proxy
- npm Scripts
- Screenshot: Analysis
- Analysis Route EPA
- Screenshot: Scheduling
- Team Events Route
- API Keys Settings UI
- Event Context Hooks
- Year Config Docs
- Dependabot
- Screenshot: Overview
- Screenshot: Pit Scouting
- Team Events by Year
- Scouter Accuracy Tests
- Assignment Route Schemas
- Team Stats Types
- ESLint Config
- TRC Logos & Icons
- Config-Driven Forms
- Setup & Docker Install
- Changelog Auth Secrets
- PostCSS Config
- Signup & Rate Limiting
- Health Endpoint Doc
- Web Push Doc
- Feature Request Template
- PR Template

## God Nodes (most connected - your core abstractions)
1. `cn()` - 175 edges
2. `Button()` - 152 edges
3. `Card()` - 124 edges
4. `CardContent()` - 122 edges
5. `react` - 120 edges
6. `next` - 119 edges
7. `CardHeader()` - 113 edges
8. `CardTitle()` - 103 edges
9. `auth` - 93 edges
10. `lucide-react` - 87 edges

## Surprising Connections (you probably didn't know these)
- `Multi-database backends (MariaDB, Azure SQL, Firebase, Cosmos)` --semantically_similar_to--> `DatabaseManager abstraction layer (DatabaseService interface)`  [INFERRED] [semantically similar]
  README.md → .github/copilot-instructions.md
- `Offline-first PWA with sync` --semantically_similar_to--> `Offline queue flow (IndexedDB, service worker sync)`  [INFERRED] [semantically similar]
  README.md → .github/copilot-instructions.md
- `EPA analytics and picklists` --semantically_similar_to--> `Analytics engine (EPA, SPR, picklists)`  [INFERRED] [semantically similar]
  README.md → .github/copilot-instructions.md
- `Multi-color theme system` --semantically_similar_to--> `OKLCH multi-theme system`  [INFERRED] [semantically similar]
  README.md → .github/copilot-instructions.md
- `teamPageConfig (JSON-driven)` --semantically_similar_to--> `teamPageConfig`  [INFERRED] [semantically similar]
  src/components/team-pages/README.md → config/years/README.md

## Import Cycles
- 2-file cycle: `src/app/dashboard/dashboard-shell.tsx -> src/components/onboarding/onboarding-checklist.tsx -> src/app/dashboard/dashboard-shell.tsx`
- 3-file cycle: `src/app/dashboard/dashboard-shell.tsx -> src/components/navigation/app-sidebar.tsx -> src/components/navigation/nav-user.tsx -> src/app/dashboard/dashboard-shell.tsx`

## Hyperedges (group relationships)
- **Contributor-facing governance documents** — contributing, security, github_pull_request_template, github_issue_template_bug_report, github_issue_template_feature_request [INFERRED 0.85]
- **Offline-first scouting data flow** — docs_architecture_use_async_data, docs_architecture_offline_cache_policy, docs_architecture_submission_queue, docs_architecture_indexeddb_event_cache [EXTRACTED 1.00]
- **Real SQL persistence test setup** — tests_database_readme, tests_database_readme_mariadb_container, tests_database_readme_sqlserver_container [EXTRACTED 1.00]
- **TRC logo variants** — public_trclogo_trc_logo_black, public_trclogowhite_trc_logo_white, public_assets_icon_192_app_icon, public_assets_icon_512_app_icon [INFERRED 0.85]
- **Field scoring and game-piece elements** — public_assets_rebuilt_field_red_hub, public_assets_rebuilt_field_blue_hub, public_assets_rebuilt_field_center_fuel_field, public_assets_rebuilt_field_red_depot, public_assets_rebuilt_field_blue_depot [INFERRED 0.75]
- **EPA chart interactive controls** — public_screenshots_analytics_wide_epa_analysis_card, public_screenshots_analytics_wide_box_whisker_toggle, public_screenshots_analytics_wide_interactive_legend [INFERRED 0.75]
- **Match scouting form structure** — public_screenshots_match_scouting_wide_match_information_card, public_screenshots_match_scouting_wide_period_tabs, public_screenshots_match_scouting_wide_teleop_period_card, public_screenshots_match_scouting_wide_increment_counter [EXTRACTED 1.00]
- **Overview live operations dashboard** — public_screenshots_overview_wide_sidebar_nav, public_screenshots_overview_wide_next_assignment_card, public_screenshots_overview_wide_coverage_card [INFERRED 0.85]
- **Pit scouting form sections** — public_screenshots_pit_scouting_wide_team_information_section, public_screenshots_pit_scouting_wide_robot_information_section, public_screenshots_pit_scouting_wide_autonomous_capabilities_toggle [EXTRACTED 0.95]

## Communities (124 total, 12 thin omitted)

### Community 0 - "FRC Team Page Charts"
Cohesion: 0.08
Nodes (42): FRCTeam2025Page(), ReefscapeData, Team2025PageProps, FRCTeam2026Page(), RebuiltData, TeamPageProps, DecodeData, FTCTeam2026Page() (+34 more)

### Community 1 - "API Route Validation"
Cohesion: 0.10
Nodes (47): papaparse, zod, createEventSchema, dateString, DELETE(), eventCode, eventFields, GET() (+39 more)

### Community 2 - "FTC Events API Client"
Cohesion: 0.05
Nodes (57): getApiStatus(), getEventAdvancement(), getEventAdvancementSource(), getEventAllianceDetails(), getEventAlliances(), getEventAwards(), getEventDetails(), getEventScores() (+49 more)

### Community 3 - "Azure SQL Service"
Cohesion: 0.10
Nodes (3): mssql, AzureSqlDatabaseService, AzureSqlConfig

### Community 5 - "UI Primitives & Variants"
Cohesion: 0.08
Nodes (40): class-variance-authority@^0.7.1, class-variance-authority, NavUser(), AlertAction(), AlertDialogMedia(), Avatar(), AvatarBadge(), AvatarFallback() (+32 more)

### Community 6 - "Dev Dependencies"
Cohesion: 0.06
Nodes (49): devDependencies, baseline-browser-mapping@^2.11.35, esbuild@^0.28.2, eslint@^10.14.0, fake-indexeddb@^6.2.8, happy-dom@^21.0.4, @playwright/test@^1.65.0, serwist@^9.5.13 (+41 more)

### Community 7 - "Admin & Sync Pages"
Cohesion: 0.14
Nodes (36): DatabaseAdminPage(), StatCard(), SettingsPage(), getDisplayName(), getPerformanceBadge(), SPRPage(), AdminAccessDeniedProps, CacheRevalidationComponent() (+28 more)

### Community 8 - "Theme & Scouting Pages"
Cohesion: 0.14
Nodes (32): lucide-react, react, sonner, MatchScoutingPage(), PitScoutingPage(), LoginFormData, Page(), Page() (+24 more)

### Community 9 - "User & Auth Routes"
Cohesion: 0.08
Nodes (31): GET(), PUT(), DELETE(), PATCH(), PUT(), RouteParams, setAccountActive(), GET() (+23 more)

### Community 10 - "Container Release Workflow"
Cohesion: 0.05
Nodes (47): uses, ATHENA_IMAGE, GH_TOKEN, RELEASE_TAG, REPOSITORY, needs, permissions, runs-on (+39 more)

### Community 11 - "First-Run Setup Wizard"
Cohesion: 0.11
Nodes (36): DatabaseProviderFieldsProps, AdminStep(), AdminStepProps, PasswordRequirement(), DatabaseStep(), DatabaseStepProps, AppUrlStep(), AppUrlStepProps (+28 more)

### Community 12 - "TBA API Client"
Cohesion: 0.07
Nodes (39): GET(), getEventDateRange(), getEventDetails(), getEventOprs(), getEventSummary(), getFromTba(), getMatchDetails(), getMatchSummary() (+31 more)

### Community 13 - "Scouting Schema & Architecture"
Cohesion: 0.08
Nodes (26): Core Architecture, IndexedDB event cache (composite key, schema v6), Scouting submission queue policy, useAsyncData, prepareEditor(), fill(), Kind, prepare() (+18 more)

### Community 14 - "Sidebar Navigation"
Cohesion: 0.12
Nodes (37): DashboardSidebarLoading(), MetricTooltip(), SearchForm(), AppSidebar(), data, NavAdmin(), NavMain(), Collapsible() (+29 more)

### Community 15 - "Schedule Assignment Persistence"
Cohesion: 0.08
Nodes (19): assignmentSignature(), entryIdentity, scheduleKey(), sortedAssignments(), Query, DRIVE_TRAINS, DriveTrain, GameScalar (+11 more)

### Community 16 - "Env & Setup Completion"
Cohesion: 0.08
Nodes (32): handlePost(), POST(), dynamic, GET(), PATCH(), requireAdmin(), dynamic, Page() (+24 more)

### Community 17 - "API Route Test Doubles"
Cohesion: 0.11
Nodes (26): vitest, {
  mockAuthSession,
  mockWriteFile,
  mockMkdir,
  mockExistsSync,
  mockReadFileSync,
}, authSession, authSession, authSession, authSession, authSession, post() (+18 more)

### Community 18 - "Game Config Studio"
Cohesion: 0.09
Nodes (32): ScoringFieldProps, BuilderJsonEditorProps, ComponentPalette(), ComponentPaletteProps, PaletteComponentType, ConfigOption, loadConfigList(), loadSavedConfig() (+24 more)

### Community 19 - "Node Built-ins & Bootstrap"
Cohesion: 0.10
Nodes (15): directory, server, handlePost(), POST(), register(), developmentSecret(), getSetupToken(), createSessionRefresh() (+7 more)

### Community 20 - "Azure Deploy Workflow"
Cohesion: 0.06
Nodes (38): needs, permissions, runs-on, steps, uses, needs, permissions, runs-on (+30 more)

### Community 21 - "Data Tables & Team Mgmt"
Cohesion: 0.13
Nodes (32): @tanstack/react-table, CreateUserData, loadUsers(), TeamManagement(), UpdateUserData, User, AnalysisTableRow, columns (+24 more)

### Community 22 - "SQL Row Mapping"
Cohesion: 0.12
Nodes (25): mysql2@^3.24.6, mysql2, Row, SqlParam, toCustomEvent(), toMatchEntry(), toPicklist(), toPicklistEntry() (+17 more)

### Community 23 - "Picklist & Matchup Cards"
Cohesion: 0.14
Nodes (27): FRCMatchupCard2025(), ReefscapeMatchupData, FRCMatchupCard2026(), RebuiltMatchupData, DecodeMatchupData, FTCMatchupCard2026(), Example components README, PicklistPage() (+19 more)

### Community 24 - "Event Data Routes"
Cohesion: 0.12
Nodes (30): GET(), GET(), GET(), GET(), MatchScheduleEntry, MatchScheduleResponse, MatchScheduleTeam, parseFtcMatchResults() (+22 more)

### Community 25 - "Account & Guest Dialogs"
Cohesion: 0.15
Nodes (23): AccountSettingsDialog(), loadPreferredPartners(), loadUsers(), User, NotificationSettingsDialog(), EventSwitcher(), formatDate(), GuestAccessControls() (+15 more)

### Community 26 - "Dashboard & Match Form"
Cohesion: 0.14
Nodes (31): AttentionItem(), Page(), progressPercent(), ProgressRow(), RecentActivity(), subscribeToLocalStorage(), DynamicMatchScoutForm(), defaultData (+23 more)

### Community 27 - "Import Validation & Year Config"
Cohesion: 0.10
Nodes (10): PerformanceOverTimeChartProps, getYearConfig(), ImportValidationResult, validateImportAgainstSchema(), requireOwnership(), ScoutingError, MatchEntry, PitEntry (+2 more)

### Community 28 - "Database CI Workflow"
Cohesion: 0.05
Nodes (36): env, image, ports, ACCEPT_EULA, MARIADB_ROOT_HOST, MARIADB_ROOT_PASSWORD, MSSQL_SA_PASSWORD, TEST_DATABASE_PASSWORD (+28 more)

### Community 30 - "Dashboard Shell & Auth Types"
Cohesion: 0.10
Nodes (28): next-auth, AdminLayout(), AccountSettingsContext, AccountSettingsDialog, DashboardShell(), NotificationSettingsContext, NotificationSettingsDialog, useAccountSettingsDialog() (+20 more)

### Community 31 - "Runtime Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, @azure/cosmos@^4.10.2, @azure/identity@^4.14.1, bcryptjs@^3.0.3, clsx@^2.1.1, cmdk@^1.1.1, firebase-admin@^14.5.0, lucide-react@^1.70.0 (+27 more)

### Community 33 - "Web Push Notifications"
Cohesion: 0.11
Nodes (27): web-push@^3.6.7, web-push, POST(), POST(), POST(), constantTimeEquals(), getMatchNumberFromMatchKey(), PingPayload (+19 more)

### Community 34 - "Analysis Page & EPA Charts"
Cohesion: 0.10
Nodes (28): buildTopBottom(), EPATable, formatInsightValue(), InsightItem, InsightResult, InsightSection(), Page(), buildItems() (+20 more)

### Community 35 - "Picklist Hook & Model"
Cohesion: 0.10
Nodes (12): MatchupAlliancePanelProps, DraggablePicklistProps, loadExistingPicklist(), loadInitialRanking(), TeamPicklistData, usePicklist(), UsePicklistOptions, CompetitionType (+4 more)

### Community 36 - "Offline Queue Manager"
Cohesion: 0.14
Nodes (3): OfflineQueueManager, SyncConfig, SyncResult

### Community 37 - "Guest Link Service"
Cohesion: 0.12
Nodes (23): accessSchema, DELETE(), GET(), headers, PATCH(), POST(), GuestSignIn(), dynamic (+15 more)

### Community 38 - "Select & Provider Fields"
Cohesion: 0.31
Nodes (25): DatabaseProviderFields(), ScoringField(), ScoringSection(), SampleSelect(), MatchupPage(), MatchAssignmentRow, fetchScoutList(), ScoutSelector() (+17 more)

### Community 39 - "IndexedDB Cache Reads"
Cohesion: 0.16
Nodes (18): CacheOptions, CachedAnalysisData, CachedEventList, CachedEventTeams, CachedMatchEntries, CachedPitEntries, CachedScoutList, CachedTeamInfo (+10 more)

### Community 40 - "Game Config Store"
Cohesion: 0.18
Nodes (23): CONFIG_YEARS_DIR, ConfigSummary, DELETE(), dynamic, GET(), isSafeConfigFilename(), loadConfigsFromDirectory(), PATCH() (+15 more)

### Community 41 - "Roles & Permissions"
Cohesion: 0.17
Nodes (15): PUT(), RouteParams, GameConfigAdminPage(), ApiKeysAdminPage(), NotificationsAdminPage(), TeamManagementPage(), GuestLinksPage(), AdminAccessDenied() (+7 more)

### Community 42 - "Service Worker"
Cohesion: 0.08
Nodes (17): appRuntimeCaching, BackgroundSyncEvent, ExtendableServiceWorkerEvent, networkOnly, NotificationClickEvent, PushMessageEvent, PushNotificationPayload, retryFailedEntries() (+9 more)

### Community 43 - "Nexus API Client"
Cohesion: 0.09
Nodes (26): getEvents(), getFromNexus(), getPitAddresses(), getPitMap(), Announcement, Area, Arrow, EventKey (+18 more)

### Community 44 - "Security Workflow"
Cohesion: 0.08
Nodes (26): runs-on, steps, jobs, dependencies, secrets, name, on, pull_request (+18 more)

### Community 45 - "Analysis & SPR Hooks"
Cohesion: 0.13
Nodes (20): AnalysisStats, EMPTY_STATS, transformToStats(), useAnalysisStats(), AsyncDataState, SettledResult, useAsyncData(), useSelectedEvent() (+12 more)

### Community 46 - "Form Drafts & Pit Form"
Cohesion: 0.16
Nodes (18): DynamicPitScoutForm(), FieldDrawingCanvas(), SelectGroup(), Switch(), Textarea(), useFormDraft(), UseFormDraftOptions, useCurrentGameConfig() (+10 more)

### Community 47 - "Spreadsheet Import Parser"
Cohesion: 0.12
Nodes (19): xlsx, createLink(), fetchStats(), fetchTeams(), buildGameSpecificData(), competitionType(), InvalidSpreadsheetError, isZipContainer() (+11 more)

### Community 48 - "Cosmos DB Provider"
Cohesion: 0.21
Nodes (8): CosmosDatabaseService, CosmosDocumentStore, decode(), isolated, legacyShape, status(), Document, CosmosConfig

### Community 49 - "Firebase Provider"
Cohesion: 0.13
Nodes (12): DocumentChanges, StoredDocument, FirebaseDatabaseService, FirebaseDocumentStore, FirebaseConfig, constructor(), cosmosConfig, firebaseConfig (+4 more)

### Community 50 - "CI Checks Workflow"
Cohesion: 0.09
Nodes (23): permissions, uses, permissions, runs-on, steps, permissions, uses, jobs (+15 more)

### Community 51 - "Guest Session Proxy"
Cohesion: 0.16
Nodes (17): dynamic, GET(), GameConfigContextType, readSessionToken(), createGuestEventLink(), grantSchema, signature(), verifyGuestEventLink() (+9 more)

### Community 52 - "Playwright Workflow"
Cohesion: 0.09
Nodes (22): jobs, test, name, on, push, workflow_call, contents, branches (+14 more)

### Community 53 - "Scouting Entry Routes"
Cohesion: 0.19
Nodes (18): DELETE, GET, POST, PUT, DELETE, GET, POST, PUT (+10 more)

### Community 54 - "shadcn Components Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 55 - "NextAuth Login Flow"
Cohesion: 0.18
Nodes (16): GET(), loginSubject(), POST(), handlers, isGuestAuthRequest(), isGuestPage(), pages, scopeGuestApi() (+8 more)

### Community 56 - "Team List Pages"
Cohesion: 0.23
Nodes (13): DashboardLoading(), DynamicTeamList(), DynamicTeamListProps, Page(), InitialTeamList(), TeamListPage(), TeamListSkeleton(), TeamCardSkeleton() (+5 more)

### Community 57 - "Scout Schedule Page"
Cohesion: 0.22
Nodes (13): SchedulePage(), ScoutSchedulePage(), GuestMatchSchedule(), ActiveScoutCheckbox, Checkbox(), useMatchScheduleTeams(), autoAssignMatches(), computeUserWorkload() (+5 more)

### Community 58 - "Guest Link Persistence"
Cohesion: 0.13
Nodes (5): Query, Row, sqlGuestLinks(), GuestLinkStore, GuestLinkRecord

### Community 59 - "Document Store Ops"
Cohesion: 0.13
Nodes (5): alreadyExists(), duplicateUsername(), now(), userKey(), usernameKey()

### Community 60 - "PWA Manifest & Robots"
Cohesion: 0.14
Nodes (15): screenshots, robots(), sitemap(), NotificationOptions, NotificationState, removeSubscriptionFromBackend(), sendSubscriptionToBackend(), urlBase64ToUint8Array() (+7 more)

### Community 61 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 62 - "Project Docs & Guides"
Cohesion: 0.11
Nodes (18): AGENTS.md Next.js agent rules, CONTRIBUTING guide, AthenaV2 Copilot Instructions, Analytics engine (EPA, SPR, picklists), API route auth guards (require-permission helpers), Public event proxy routes (TBA, FTC), Offline queue flow (IndexedDB, service worker sync), Role-based access control (roles and permissions) (+10 more)

### Community 63 - "Rate Limit & Password Auth"
Cohesion: 0.19
Nodes (13): bcryptjs, POST(), POST(), PUT(), checkRateLimit(), cleanupExpiredEntries(), getClientIp(), getRateLimitHeaders() (+5 more)

### Community 64 - "Datapoint Registry"
Cohesion: 0.16
Nodes (16): getFieldType(), DatapointMultiPickerProps, DatapointPickerProps, NumberField(), TeamPageInspector(), TextField(), getIconComponent(), VisualMatchupCanvasProps (+8 more)

### Community 65 - "Onboarding Tour"
Cohesion: 0.16
Nodes (16): GuidedTour(), memory, OnboardingContext, OnboardingContextValue, OnboardingProvider(), save(), startTour(), stopTour() (+8 more)

### Community 66 - "Command & Datapoint Picker"
Cohesion: 0.26
Nodes (16): DatapointMultiPicker(), DatapointPicker(), Command(), CommandEmpty(), CommandGroup(), CommandItem(), CommandList(), MultiSelect() (+8 more)

### Community 67 - "Event Cache Manager"
Cohesion: 0.19
Nodes (19): buildStepLabel(), buildSteps(), cacheAnalysisData(), cacheMatchEntries(), cachePages(), cachePitEntries(), CacheResult, cacheSchedule() (+11 more)

### Community 68 - "Scoring Statistics"
Cohesion: 0.19
Nodes (14): calculatePeriodPoints(), AllianceEquationData, calculateConsistency(), calculateEPA(), calculatePeriodAverages(), calculateTeamRankings(), calculateTeamStats(), computeScouterAccuracy() (+6 more)

### Community 69 - "Image Carousel"
Cohesion: 0.20
Nodes (16): embla-carousel-react@^8.6.0, embla-carousel-react, TeamCarousel(), Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps (+8 more)

### Community 70 - "Root Layout & Toaster"
Cohesion: 0.20
Nodes (12): next-themes, metadata, RootLayout(), SonnerToaster(), ServiceWorkerManager(), ThemeProvider(), TooltipProvider(), EventProvider() (+4 more)

### Community 71 - "Field Drawing Canvas"
Cohesion: 0.14
Nodes (15): radix-ui, distPointToSegment(), DrawingDataV2, FieldDrawingCanvasProps, isTokenType(), parseDrawingData(), Point, pointHitsStroke() (+7 more)

### Community 72 - "Confirm Dialogs & Submit"
Cohesion: 0.32
Nodes (14): DeleteConfirmationDialog(), DeleteConfirmationDialogProps, FormSubmitButtons(), FormSubmitButtonsProps, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent() (+6 more)

### Community 73 - "Custom Events & Accounts"
Cohesion: 0.13
Nodes (4): CustomEvent, AccountStore, CustomEventStore, DatabaseService

### Community 74 - "Deployment Docs"
Cohesion: 0.13
Nodes (16): Persistence contracts (types/db/service.ts), Provider resolver (server/db-service.ts), Deploying Athena, Supported database providers, Secrets and initial setup (AUTH_SECRET, SETUP_TOKEN), Install Athena with Docker, docker-compose.yml prebuilt image, GHCR image publishing workflow (+8 more)

### Community 75 - "Health & Colors Routes"
Cohesion: 0.18
Nodes (8): next, FRCColorsEventResponse, FRCColorsTeam, GET(), GET(), requireAnyPermission(), requireAuth(), sessionHasPermission()

### Community 76 - "Provider Options Setup"
Cohesion: 0.21
Nodes (15): cleanString(), GET(), mergeConfig(), POST(), providers, summarizeConfig(), validateConfig(), cleanString() (+7 more)

### Community 77 - "pnpm Workspace"
Cohesion: 0.12
Nodes (15): allowBuilds, esbuild, @firebase/util, msw, @prisma/client, protobufjs, sharp, @swc/core (+7 more)

### Community 78 - "Database Manager"
Cohesion: 0.25
Nodes (3): DatabaseManager, loadPersistedDatabaseConfig(), DatabaseConfig

### Community 79 - "Dashboard Stats Client"
Cohesion: 0.15
Nodes (11): DashboardStats, DEFAULT_DASHBOARD_STATS, CreateResult, matchApi, pitApi, statsApi, teamApi, DashboardStats (+3 more)

### Community 80 - "Offline Sync Engine"
Cohesion: 0.17
Nodes (9): syncOfflineData(), indexedDBService, DEFAULT_SYNC_CONFIG, SignInRequiredError, DedupeQueueResult, QueuedEntry, QueuedMatchEntry, QueuedPitEntry (+1 more)

### Community 81 - "Session & Guest Boundary"
Cohesion: 0.22
Nodes (9): GuestAccessBoundary(), ActiveSessionRefresh(), SessionProvider(), useActivePolling(), assignmentsCache, getAssignmentsCacheKey(), MatchAssignmentRow, ScoutingAssignment (+1 more)

### Community 82 - "Year Config Loader"
Cohesion: 0.25
Nodes (7): buildPreviewMatches(), buildPreviewPitEntry(), buildPreviewStats(), buildPreviewTeamData(), seededValue(), calculateDetailedGameStats(), DetailedGameStats

### Community 83 - "useOffline Hook"
Cohesion: 0.20
Nodes (11): queue(), readQueueCounts(), useOffline(), UseOfflineReturn, useOnlineStatus(), offlineQueueManager, NetworkStatus, okResult (+3 more)

### Community 85 - "Document DB Tests"
Cohesion: 0.24
Nodes (6): encodeDocument(), account, match, MemoryStore, pit, scope

### Community 86 - "Scouting Entries Hook"
Cohesion: 0.29
Nodes (7): EntryTypes, readCachedEntries(), useScoutingEntries(), HttpError, requestJSON(), loadWithOfflineCache(), OfflineDataResult

### Community 87 - "Matchup Probability"
Cohesion: 0.21
Nodes (8): MatchupRoute(), MatchType, NO_EPA_DATA, TeamEpaMap, estimateWinProbability(), normalCdf(), TeamScoreHistory, WinProbability

### Community 88 - "Sheet Component"
Cohesion: 0.26
Nodes (9): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal(), SheetTitle() (+1 more)

### Community 89 - "Schedule Data Hook"
Cohesion: 0.21
Nodes (11): assignmentsCache, getAssignmentsCacheKey(), getMatchCountCacheKey(), MatchAssignmentRow, matchCountCache, ScheduleAssignmentChange, ScheduleBlock, User (+3 more)

### Community 90 - "Game Config Context"
Cohesion: 0.27
Nodes (9): gameConfig, GameConfigContext, GameConfigProvider(), storageListeners, subscribeToNothing(), subscribeToSelections(), useStoredSelection(), writeSelection() (+1 more)

### Community 91 - "Rebuilt Field Map"
Cohesion: 0.22
Nodes (11): Blue alliance zone, Blue alliance game-piece depot (lower right), Blue hexagonal hub (scoring goal), Blue tower/climb structure (bottom), Center neutral zone yellow game-piece grid, Driver station walls and outposts at field ends, Rebuilt Field top-down map (FRC), Red alliance zone (+3 more)

### Community 92 - "Match Scouting Screenshot"
Cohesion: 0.22
Nodes (11): Match scouting marketing screenshot, mobile stacked layout, Athena logo and wordmark, 03 / CAPTURE headline: Eyes on the field. Data at your fingertips., Increment counter control (-10 -5 -1 value +1 +5 +10), Match Information card (match number, team number, alliance position), REBUILT Match Scouting screen (narrow and wide screenshots), Match scouting marketing screenshot, desktop two-column layout, Auto / Teleop / Endgame period tabs (+3 more)

### Community 93 - "API Keys Service"
Cohesion: 0.31
Nodes (8): GET(), POST(), requireAdmin(), API_KEYS_PATH, ApiKeys, getApiKeyStatus(), RUNTIME_DIR, saveApiKeys()

### Community 94 - "Fake IndexedDB Tests"
Cohesion: 0.22
Nodes (5): installFreshIndexedDB(), Manager, match(), seed(), Storage

### Community 95 - "Docker Compose"
Cohesion: 0.20
Nodes (9): environment, image, ports, restart, volumes, services, nextapp, volumes (+1 more)

### Community 96 - "Next Config & Proxy"
Cohesion: 0.20
Nodes (8): nextConfig, @serwist/turbopack@^9.5.13, @serwist/turbopack, dynamic, dynamicParams, generateStaticParams, GET, revalidate

### Community 97 - "npm Scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, lint, start, test, test:database, test:e2e (+2 more)

### Community 98 - "Screenshot: Analysis"
Cohesion: 0.22
Nodes (9): Analysis Screen Mobile Layout, Athena Analysis Screen (04 / Decide marketing screenshot), Analysis Screen Desktop Layout, Stacked / Box & Whisker chart mode toggle, Turn match data into your next move headline, EPA Analysis card with Chart View / Table View toggle, EPA Graph stacked bar chart (Penalties, Endgame, Teleop, Auto), Clickable legend toggles categories (+1 more)

### Community 99 - "Analysis Route EPA"
Cohesion: 0.40
Nodes (9): buildMetricDefinition(), calculateMatchEPA(), flattenScoutingData(), formatCategory(), GET(), MetricValueType, quantile(), toLabelPart() (+1 more)

### Community 100 - "Screenshot: Scheduling"
Cohesion: 0.28
Nodes (9): Scheduling screenshot (narrow/mobile), Active Scouts panel (6 selected), Marketing hero: Every match. Every seat covered., Match Assignments section (8 virtual groups), Match cards with Red/Blue seat dropdowns, Responsive layout: side-by-side vs stacked, Schedule page UI, Scheduling screenshot (wide/desktop) (+1 more)

### Community 101 - "Team Events Route"
Cohesion: 0.33
Nodes (8): GET(), GET(), loadTeamsWithImages(), getEventTeamNumbers(), getSeasonTeams(), fetchTeamMedia(), getEventTeams(), getTeamMedia()

### Community 102 - "API Keys Settings UI"
Cohesion: 0.28
Nodes (7): ApiKeysConfiguration(), ApiKeyStatusResponse, FieldConfig, FIELDS, KeyStatus, SecretInput(), StatusBadge()

### Community 103 - "Event Context Hooks"
Cohesion: 0.22
Nodes (7): EventContext, EventContextType, useEventFilter(), MatchScheduleData, MatchScheduleEntry, MatchScheduleTeam, TbaEvent

### Community 104 - "Year Config Docs"
Cohesion: 0.25
Nodes (8): Year Configuration Files README, matchupCardConfig, teamPageConfig, Year config JSON files (FRC/FTC), Shared game-config library, Runtime game configuration overrides, .runtime persistent directory, teamPageConfig (JSON-driven)

### Community 105 - "Dependabot"
Cohesion: 0.25
Nodes (7): interval, updates, directory, open-pull-requests-limit, package-ecosystem, schedule, version

### Community 106 - "Screenshot: Overview"
Cohesion: 0.46
Nodes (8): Athena Overview Screenshot (narrow, mobile), Athena Overview Screenshot (wide, desktop), Coverage card (pit 36/42, quals 42/78), Next Assignment card (Match 43, Red 1), Responsive layout: split hero (desktop) vs stacked (mobile), Sidebar navigation (Competition, Data, Strategy, Settings), Tagline: Scout together. Compete with clarity., Value props: Live assignments and coverage; Offline ready for competition day

### Community 107 - "Screenshot: Pit Scouting"
Cohesion: 0.36
Nodes (8): Pit Scouting Screenshot (Narrow/Mobile), Pit Scouting Screenshot (Wide/Desktop), Has Autonomous Capabilities Toggle, Discover Hero Copy: Know the robot behind the rank, REBUILT Pit Scouting Form, Responsive Layout (side-by-side vs stacked), Robot Information Section (Drivetrain, Length, Width, Weight), Team Information Section (Team Number select)

### Community 108 - "Team Events by Year"
Cohesion: 0.43
Nodes (6): GET(), getCachedFrcTeamEvents, getCachedFtcTeamEvents, getCurrentEventForTeam(), getSeasonEvents(), getTeamEventNames()

### Community 109 - "Scouter Accuracy Tests"
Cohesion: 0.29
Nodes (4): baseResults, baseRobot, mockConfig, scouterBias

### Community 110 - "Assignment Route Schemas"
Cohesion: 0.33
Nodes (5): assignmentRecordSchema, changeSchema, noStoreHeaders, requestSchema, scopeSchema

### Community 111 - "Team Stats Types"
Cohesion: 0.60
Nodes (4): TeamPageProps, EPABreakdown, TeamStats, TeamData

### Community 112 - "ESLint Config"
Cohesion: 0.40
Nodes (4): eslintConfig, projectConfig, eslint-config-next@16.4.1, eslint-config-next

### Community 113 - "TRC Logos & Icons"
Cohesion: 0.50
Nodes (5): App Icon 192px, App Icon 512px, TRC emblem: gear ring around flaming torch/brazier with lightning bolt, TRC Logo (black, webp), TRC Logo (white, png)

### Community 114 - "Config-Driven Forms"
Cohesion: 0.50
Nodes (4): Game Config Studio persistent overrides, Dynamic configuration-driven scouting forms, Year-based game configuration system, Game Config Studio (.runtime/configs)

### Community 115 - "Setup & Docker Install"
Cohesion: 0.67
Nodes (3): Setup deployment token, Docker image installation, First-run setup wizard (/setup) with setup token

## Knowledge Gaps
- **52 isolated node(s):** `Docker image installation`, `Role-based access control (roles and permissions)`, `Dynamic configuration-driven scouting forms`, `Public event proxy routes (TBA, FTC)`, `.runtime persistence directory` (+47 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 819 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Health & Colors Routes` to `API Route Validation`, `Dev Dependencies`, `Admin & Sync Pages`, `Theme & Scouting Pages`, `User & Auth Routes`, `First-Run Setup Wizard`, `TBA API Client`, `Scouting Schema & Architecture`, `Sidebar Navigation`, `Env & Setup Completion`, `API Route Test Doubles`, `Node Built-ins & Bootstrap`, `Picklist & Matchup Cards`, `Event Data Routes`, `Dashboard & Match Form`, `Dashboard Shell & Auth Types`, `Runtime Dependencies`, `Web Push Notifications`, `Analysis Page & EPA Charts`, `Guest Link Service`, `Game Config Store`, `Roles & Permissions`, `Form Drafts & Pit Form`, `Guest Session Proxy`, `Scouting Entry Routes`, `NextAuth Login Flow`, `Team List Pages`, `PWA Manifest & Robots`, `Rate Limit & Password Auth`, `Onboarding Tour`, `Image Carousel`, `Root Layout & Toaster`, `Provider Options Setup`, `API Keys Service`, `Next Config & Proxy`, `Analysis Route EPA`, `Team Events Route`, `Team Events by Year`, `Assignment Route Schemas`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **What connects `Docker image installation`, `Role-based access control (roles and permissions)`, `Dynamic configuration-driven scouting forms` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `FRC Team Page Charts` be split into smaller, more focused modules?**
  _Cohesion score 0.08299240210403273 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Theme & Scouting Pages` to `FRC Team Page Charts`, `UI Primitives & Variants`, `Dev Dependencies`, `Admin & Sync Pages`, `First-Run Setup Wizard`, `Sidebar Navigation`, `Game Config Studio`, `Data Tables & Team Mgmt`, `Picklist & Matchup Cards`, `Account & Guest Dialogs`, `Dashboard & Match Form`, `Dashboard Shell & Auth Types`, `Runtime Dependencies`, `Analysis Page & EPA Charts`, `Picklist Hook & Model`, `Guest Link Service`, `Select & Provider Fields`, `Roles & Permissions`, `Analysis & SPR Hooks`, `Form Drafts & Pit Form`, `Team List Pages`, `Scout Schedule Page`, `PWA Manifest & Robots`, `Datapoint Registry`, `Onboarding Tour`, `Command & Datapoint Picker`, `Image Carousel`, `Root Layout & Toaster`, `Field Drawing Canvas`, `Confirm Dialogs & Submit`, `Dashboard Stats Client`, `Session & Guest Boundary`, `useOffline Hook`, `Matchup Probability`, `Sheet Component`, `Schedule Data Hook`, `Game Config Context`, `API Keys Settings UI`, `Event Context Hooks`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `API Route Validation` be split into smaller, more focused modules?**
  _Cohesion score 0.10286382232612508 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `API Route Test Doubles` to `MariaDB Service`, `Dev Dependencies`, `User & Auth Routes`, `Scouting Schema & Architecture`, `Schedule Assignment Persistence`, `Env & Setup Completion`, `Node Built-ins & Bootstrap`, `SQL Row Mapping`, `Event Data Routes`, `Import Validation & Year Config`, `Guest Link Service`, `IndexedDB Cache Reads`, `Game Config Store`, `Service Worker`, `Analysis & SPR Hooks`, `Form Drafts & Pit Form`, `Spreadsheet Import Parser`, `Firebase Provider`, `Guest Session Proxy`, `Scouting Entry Routes`, `NextAuth Login Flow`, `Scout Schedule Page`, `Rate Limit & Password Auth`, `Onboarding Tour`, `Scoring Statistics`, `Dashboard Stats Client`, `Offline Sync Engine`, `Session & Guest Boundary`, `Year Config Loader`, `useOffline Hook`, `Document DB Tests`, `Scouting Entries Hook`, `Matchup Probability`, `Fake IndexedDB Tests`, `Scouter Accuracy Tests`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `FTC Events API Client` be split into smaller, more focused modules?**
  _Cohesion score 0.05376972530683811 - nodes in this community are weakly interconnected._