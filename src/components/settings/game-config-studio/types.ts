import type {
  YearConfig,
  ScoringDefinition,
  PitScoutingFieldDefinition,
} from "@/lib/types";

export interface BuilderState {
  competitionType: "FRC" | "FTC";
  year: number;
  config: YearConfig;
  selectedFile?: string;
  isDirty: boolean;
}

export function slugifyKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const DEFAULT_NEW_CONFIG: YearConfig = {
  competitionType: "FRC",
  gameName: "NEW_GAME",
  startPositions: ["Left", "Center", "Right"],
  scoring: {
    autonomous: {
      leave: {
        label: "Leave Starting Zone",
        points: 2,
        description: "Robot leaves starting zone during auto",
        type: "boolean",
      },
      game_piece_scored: {
        label: "Game Pieces Scored (Auto)",
        points: 4,
        description: "Number of game pieces scored during autonomous",
        increments: [1, 2, 5],
      },
    },
    teleop: {
      game_piece_scored: {
        label: "Game Pieces Scored (Teleop)",
        points: 2,
        description: "Number of game pieces scored during teleop",
        increments: [1, 2, 5],
      },
      game_piece_missed: {
        label: "Game Pieces Missed",
        points: 0,
        description: "Missed scoring attempts",
        increments: [1, 2],
      },
    },
    endgame: {
      climb_state: {
        label: "Ending Climb State",
        description: "Robot's final climb status during endgame",
        pointValues: {
          none: 0,
          parked: 2,
          shallow: 6,
          deep: 12,
        },
      },
      robot_broke_down: {
        label: "Robot Broke Down",
        description: "Robot experienced mechanical or electrical failure",
        type: "boolean",
      },
    },
    fouls: {
      minor_fouls: {
        label: "Minor Fouls",
        points: -3,
        description: "Minor penalties committed",
      },
      tech_fouls: {
        label: "Tech Fouls",
        points: -10,
        description: "Technical fouls committed",
      },
    },
  },
  pitScouting: {
    autonomous: {
      autoRoutines: {
        label: "Available Auto Routines",
        type: "multiselect",
        options: ["Leave Only", "1 Piece Auto", "Multi Piece Auto"],
      },
    },
    teleoperated: {
      driveTrainType: {
        label: "Drivetrain Type",
        type: "select",
        options: ["Swerve", "Tank / West Coast", "Mecanum", "Other"],
      },
      intakeType: {
        label: "Intake Mechanism",
        type: "select",
        options: ["Ground Intake", "Source / Human Player", "Both"],
      },
      scoringCapability: {
        label: "Primary Scoring Goal",
        type: "select",
        options: ["High Goal", "Low Goal", "Both"],
      },
    },
    driveTeam: {
      drivePracticeHours: {
        label: "Driver Practice Hours",
        type: "select",
        options: ["<10 Hours", "10-25 Hours", "25-50 Hours", "50+ Hours"],
      },
    },
    endgame: {
      canClimb: {
        label: "Can Climb / Park",
        type: "boolean",
      },
      climbTimeSeconds: {
        label: "Estimated Climb Time (seconds)",
        type: "number",
        dependsOn: "canClimb",
      },
    },
  },
  analysisInsights: {
    insights: [
      {
        id: "breakdown_rate",
        title: "Breakdown Rate",
        description: "Frequency of robot breakdowns during matches",
        ranking: "lower",
        valueFormat: "percent",
        rawLabel: "Breakdowns / Matches",
        calculation: {
          type: "booleanRate",
          key: "endgame.robot_broke_down",
        },
      },
    ],
  },
  matchupCardConfig: {
    autoMetrics: [
      { key: "autonomous.game_piece_scored", label: "Auto Scored" },
    ],
    teleopMetrics: [
      { key: "teleop.game_piece_scored", label: "Teleop Scored" },
    ],
    endgame: {
      stateKey: "endgame.climb_state",
      states: [
        { key: "deep", label: "Deep Climb" },
        { key: "shallow", label: "Shallow Climb" },
        { key: "parked", label: "Parked" },
      ],
    },
    warnings: {
      breakdownThreshold: 15,
      foulThreshold: 1.0,
    },
  },
  teamPageConfig: {
    kpis: {
      auto: {
        key: "autonomous.game_piece_scored",
        label: "Avg Auto Scored",
      },
      teleop: {
        key: "teleop.game_piece_scored",
        label: "Avg Teleop Scored",
      },
    },
    autoPerformance: {
      metrics: [{ key: "autonomous.game_piece_scored", label: "Auto Scored" }],
      showPointsEstimate: true,
      pointsFormula: [{ key: "autonomous.game_piece_scored", points: 4 }],
    },
    teleopPerformance: {
      metrics: [{ key: "teleop.game_piece_scored", label: "Teleop Scored" }],
      showPointsEstimate: true,
      pointsFormula: [{ key: "teleop.game_piece_scored", points: 2 }],
    },
    scoringBreakdownChart: {
      title: "Scoring Breakdown",
      description: "Average scoring actions per match",
      items: [
        {
          name: "Auto Scored",
          key: "autonomous.game_piece_scored",
          fill: "#3b82f6",
        },
        {
          name: "Teleop Scored",
          key: "teleop.game_piece_scored",
          fill: "#10b981",
        },
      ],
    },
    endgame: {
      title: "Climb Distribution",
      description: "Endgame climb level frequencies",
      displayType: "chart",
      stateKey: "endgame.climb_state",
      states: [
        { value: "none", label: "None", points: 0 },
        { value: "parked", label: "Parked", points: 2 },
        { value: "shallow", label: "Shallow", points: 6 },
        { value: "deep", label: "Deep", points: 12 },
      ],
    },
    penalties: {
      title: "Penalties",
      description: "Foul averages",
      minorKey: "fouls.minor_fouls",
      minorLabel: "Minor Fouls",
      minorPoints: -3,
      majorKey: "fouls.tech_fouls",
      majorLabel: "Tech Fouls",
      majorPoints: -10,
    },
  },
};

type AnyField = ScoringDefinition | PitScoutingFieldDefinition;
export type FieldMode = "match" | "pit";

/** The fields of one form section; match and pit share the same shape. */
export function getSection<T extends AnyField = AnyField>(
  config: YearConfig,
  mode: FieldMode,
  section: string,
): Record<string, T> {
  const root = (mode === "match" ? config.scoring : config.pitScouting) as unknown as
    | Record<string, Record<string, T> | undefined>
    | undefined;
  return root?.[section] ?? {};
}

export function updateSection<T extends AnyField = AnyField>(
  config: YearConfig,
  mode: FieldMode,
  section: string,
  update: (fields: Record<string, T>) => Record<string, T>,
): YearConfig {
  const rootKey = mode === "match" ? "scoring" : "pitScouting";
  return {
    ...config,
    [rootKey]: {
      ...config[rootKey],
      [section]: update(getSection<T>(config, mode, section)),
    },
  };
}

export function uniqueKey(taken: Record<string, unknown>, base: string): string {
  let key = base;
  for (let n = 2; key in taken; n++) key = `${base}_${n}`;
  return key;
}

export function renameKey<T>(
  record: Record<string, T>,
  from: string,
  to: string,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key === from ? to : key, value]),
  );
}

/** Rename a field in place and repoint everything that references it. */
export function renameField(
  config: YearConfig,
  mode: FieldMode,
  section: string,
  from: string,
  to: string,
): YearConfig {
  const next = updateSection(config, mode, section, (fields) =>
    Object.fromEntries(
      Object.entries(fields).map(([key, definition]) => [
        key === from ? to : key,
        definition.dependsOn === from ? { ...definition, dependsOn: to } : definition,
      ]),
    ),
  );
  if (mode === "pit") {
    const matchup = next.matchupCardConfig;
    if (!matchup?.pitHighlights) return next;
    return {
      ...next,
      matchupCardConfig: {
        ...matchup,
        pitHighlights: matchup.pitHighlights.map((highlight) =>
          highlight.section === section && highlight.field === from
            ? { ...highlight, field: to }
            : highlight,
        ),
      },
    };
  }
  // A qualified key ("teleop.fuel_scored") only ever appears as a reference,
  // so swapping the exact string reaches every matchup, team page, insight and
  // derived-metric use at once.
  return JSON.parse(
    JSON.stringify(next).replaceAll(
      JSON.stringify(`${section}.${from}`),
      JSON.stringify(`${section}.${to}`),
    ),
  );
}
