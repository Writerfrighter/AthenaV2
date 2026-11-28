import type { YearConfig } from "@/lib/types";

/** The config's shape, in the terms the app validates. Kept short so it fits any chat model. */
const SCHEMA = `type YearConfig = {
  competitionType: "FRC" | "FTC";
  gameName: string;                       // e.g. "REBUILT"
  startPositions?: string[];              // where a robot may start, e.g. ["Left", "Center", "Right"]
  scoring: {                              // the MATCH scouting form, one entry per robot per match
    autonomous: Record<string, ScoringField>;
    teleop: Record<string, ScoringField>;
    endgame: Record<string, ScoringField>;
    fouls?: Record<string, ScoringField>;
  };
  pitScouting: {                          // the PIT scouting form, one entry per team per event
    autonomous: Record<string, PitField>;
    teleoperated: Record<string, PitField>;
    driveTeam?: Record<string, PitField>;
    endgame: Record<string, PitField>;
  };
  derivedMetrics?: { key: string; label: string; op: "sum" | "ratio"; inputs: string[]; denominator?: string[]; asPercent?: boolean }[];
  analysisInsights?: { insights: {
    id: string; title: string; description?: string;
    ranking: "higher" | "lower";          // which end is better
    valueFormat?: "percent" | "number"; rawLabel?: string;
    calculation: { type: "booleanRate"; key: string }
               | { type: "ratio"; numeratorKeys: string[]; denominatorKeys: string[] }
               | { type: "sum"; keys: string[] };
  }[] };
  matchupCardConfig?: {
    autoMetrics: Metric[]; teleopMetrics: Metric[];
    endgame: { stateKey?: string; bestClimbKey?: string; states: { key: string; label: string; threshold?: number }[] };
    warnings?: { breakdownThreshold?: number; foulThreshold?: number; techFoulThreshold?: number; majorPenaltyThreshold?: number; minorPenaltyThreshold?: number };
    playstyleKey?: string;
    pitHighlights?: { section: "autonomous" | "teleoperated" | "endgame" | "driveTeam"; field: string; label: string; unit?: string }[];
  };
  teamPageConfig?: object;                // optional: leave it out and the app builds a sensible default
};

type ScoringField = {
  label: string;                          // what scouts see
  description: string;                    // one-line help text for scouts
  type?: "number" | "boolean" | "select"; // number = a counter with +/- buttons
  points?: number;                        // points per count (number) or when yes (boolean); negative for fouls
  increments?: number[];                  // counter buttons, e.g. [1, 5]
  pointValues?: Record<string, number>;   // select only: option key -> points, e.g. { "none": 0, "level_1": 3 }
  dependsOn?: string;                     // key of a boolean field in the SAME section; shown only when that is yes
};

type PitField = {
  label: string;
  type: "text" | "number" | "boolean" | "select" | "multiselect";
  options?: string[];                     // select and multiselect only
  dependsOn?: string;                     // endgame section only: key of a boolean field in that section
};

type Metric = { key: string; label: string; type?: "number" | "rate" | "badge"; threshold?: number; hideIfZero?: boolean; unit?: string };`;

const RULES = `Rules the app checks when I paste your JSON:
- Field keys are lower_snake_case and unique within their section.
- Everywhere outside the forms, a match field is referenced as "section.key", e.g. "teleop.coral_l4". Every reference must point at a field that exists.
- A select field's endgame states are referenced by its pointValues keys, e.g. matchupCardConfig.endgame.stateKey = "endgame.climb" with states [{ "key": "deep", ... }].
- pitHighlights use the pit section and the plain pit field key.
- derivedMetrics keys start with "calculated." and only use scouted match fields as inputs.
- Insights and derived metrics only use number fields (sum/ratio) or boolean fields (booleanRate).
- Breakdowns: include a boolean endgame field "robot_broke_down" and a select "robot_playstyle" with options offensive / balanced / defensive, so the matchup card's reliability and playstyle features work.
- Name foul counters "fouls" and "tech_fouls" (or "minor_penalties" and "major_penalties") in the fouls section, so the matchup card's foul warnings work.
- Count things scouts can see and count quickly in a live match. Don't ask scouts for things only the field system knows.`;

export interface AiPromptOptions {
  config: YearConfig;
  year: number;
  /** Link to the official game manual, if the user has one. */
  manualUrl?: string;
  /** Anything the user wants the AI to know or focus on. */
  notes?: string;
  /** Build on the current config rather than starting over. */
  startFromCurrent: boolean;
}

/** The prompt a user pastes into any chat AI to draft a config. */
export function buildAiPrompt({ config, year, manualUrl, notes, startFromCurrent }: AiPromptOptions): string {
  const program = config.competitionType;
  // The field image is a large data URL the AI can't use; the studio keeps it when the reply is applied.
  const current: Partial<YearConfig> = { ...config };
  delete current.fieldImage;
  const manual = manualUrl?.trim()
    ? `The official game manual is here: ${manualUrl.trim()}\nRead it, especially the scoring, match period and penalty sections. If you cannot open the link (PDFs often fail), tell me and ask me to upload the PDF here or paste its point value table. Do not guess point values.`
    : `Use the official ${program} ${year} game manual for "${config.gameName}" (published by FIRST). If you cannot read it, tell me, and ask me to upload the manual PDF here or paste its point value table. Do not guess point values.`;

  return [
    `You are helping my ${program} robotics team set up our scouting app, Athena, for the ${year} game "${config.gameName}". The app is configured by one JSON object. I need you to write that JSON.`,
    `## The game\n${manual}`,
    notes?.trim() ? `## What I want\n${notes.trim()}` : "",
    `## How to work with me
1. FIRST, before writing any JSON, ask me clarifying questions. Ask about what you can't decide from the manual, for example:
   - What do we most want to learn about other teams: scoring output, accuracy, defense, reliability, endgame?
   - How much can a scout track in one match? Should scoring be split by location or level, or counted as one total?
   - Should we count misses as well as scores?
   - Which endgame results and penalties matter to us?
   - What do we want to ask teams in the pit: drivetrain, mechanisms, autos, cycle times, drive team experience?
   - What should stand out on the matchup card when we plan a match?
   Ask in one short numbered list, then STOP and wait for my answers.
2. After I answer, briefly list the fields you plan for each section and ask me to confirm or adjust.
3. Only then reply with the complete JSON in a single \`\`\`json code block, with nothing else inside the block. Return the WHOLE config, not a partial one.
4. If I paste errors from the app back to you, fix them and return the whole JSON again.`,
    `## The JSON format\n\`\`\`ts\n${SCHEMA}\n\`\`\``,
    `## ${RULES}`,
    startFromCurrent
      ? `## Our current config\nStart from this and change it. Keep anything that still fits the game, and keep its style of keys and labels.\n\`\`\`json\n${JSON.stringify(current, null, 2)}\n\`\`\``
      : `## Example of the format\nThis is only an example of the format. Don't reuse its fields; design new ones for this game.\n\`\`\`json\n${JSON.stringify(current, null, 2)}\n\`\`\``,
    `Remember: start with your clarifying questions, not with JSON.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** The follow-up to paste when the app rejects the AI's JSON. */
export function buildFixPrompt(errors: string[]): string {
  return `The app rejected that JSON with these errors. Fix them and return the whole config again in one \`\`\`json block:\n${errors.map((e) => `- ${e}`).join("\n")}`;
}

/** Pulls the JSON object out of a chat reply: a fenced block if there is one, else the outermost braces. */
export function extractJson(reply: string): unknown {
  const fenced = reply.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const text = fenced ? fenced[1] : reply;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object found. Paste the AI's whole reply, or just its JSON block.");
  return JSON.parse(text.slice(start, end + 1));
}
