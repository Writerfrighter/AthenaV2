import { MODEL_BASE64 } from "./model";

/**
 * Labels a scouting note by what it says about the robot being scouted, and
 * tags the parts of the game it mentions. Runs in the browser and on the
 * server from bundled weights: no network call, nothing stored.
 *
 * The labels are hints, not facts. On notes from an event the model has not
 * seen it agrees with a human reader about 6 times in 10, so every place that
 * shows them also shows the note itself.
 */
export type NoteLabel = "positive" | "mixed" | "negative" | "neutral";

export interface NoteInsight {
  label: NoteLabel;
  /** Up to two game areas the note mentions, most specific first. */
  topics: string[];
}

const FEATURE_COUNT = 8192;
const HEAD_LENGTH = FEATURE_COUNT + 1;
const MAX_NOTE_LENGTH = 2000;

function noteFeatures(note: string): Set<number> {
  const words =
    note
      .slice(0, MAX_NOTE_LENGTH)
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[0-9]+/g, "0")
      .match(/[a-z0-9]+/g) ?? [];
  const features = new Set<number>();
  const add = (feature: string) => {
    let hash = 2166136261;
    for (let i = 0; i < feature.length; i++) {
      hash = Math.imul(hash ^ feature.charCodeAt(i), 16777619);
    }
    features.add((hash >>> 0) % FEATURE_COUNT);
  };
  for (let i = 0; i < words.length; i++) {
    add(`word:${words[i]}`);
    if (i > 0) add(`pair:${words[i - 1]} ${words[i]}`);
    const word = `^${words[i]}$`;
    for (let length = 3; length <= 4; length++) {
      for (let start = 0; start + length <= word.length; start++) {
        add(`char:${word.slice(start, start + length)}`);
      }
    }
  }
  return features;
}

let weights: Float32Array | undefined;

/** Decoded once per process or tab; the training step bakes both cutoffs into the biases. */
function loadWeights(): Float32Array {
  if (weights) return weights;
  const bytes = Uint8Array.from(atob(MODEL_BASE64), (char) => char.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  if (bytes.byteLength !== 4 + 2 * HEAD_LENGTH * 4 || view.getUint32(0) !== 0x53435331) {
    throw new Error("Unsupported note sentiment model");
  }
  const decoded = new Float32Array(2 * HEAD_LENGTH);
  for (let i = 0; i < decoded.length; i++) decoded[i] = view.getFloat32(4 + i * 4, true);
  return (weights = decoded);
}

/** True when the head at `offset` scores the note above its cutoff. */
function fires(model: Float32Array, offset: number, features: Set<number>): boolean {
  let sum = model[offset + FEATURE_COUNT];
  for (const feature of features) sum += model[offset + feature];
  return sum >= 0;
}

// Ordered from the most specific area to the most general one.
const TOPICS: [string, RegExp][] = [
  ["reliability", /\b(broke|broken|breaks?|died|dead|disabled?|disconnect\w*|brown ?out\w*|stuck|jam\w*|tip\w*|fell|flipped|stopped moving|no ?show|e-?stop\w*)\b/],
  ["fouls", /\b(fouls?|penalt\w+|(yellow|red) card)\b/],
  ["climb", /\b(climb\w*|hang\w*|endgame|park\w*)\b/],
  ["auto", /\b(auto|auton|autos|autonomous)\b/],
  ["defense", /\b(defen[sc]\w*|block\w*|pinn?\w*)\b/],
  ["intake", /\b(intak\w*|pick(ed|ing|s)? ?up|collect\w*|ground pickup)\b/],
  ["scoring", /\b(scor\w*|shoot\w*|shots?|shooter|cycl\w*|accura\w*|miss\w*)\b/],
  ["driving", /\b(driv\w*|slow\w*|fast\w*|speed\w*|maneuver\w*|swerve)\b/],
];

const cache = new Map<string, NoteInsight | null>();

/** Returns null for a blank note, which has nothing to label. */
export function classifyNote(note: string | null | undefined): NoteInsight | null {
  const text = note?.trim() ?? "";
  if (!text) return null;
  const cached = cache.get(text);
  if (cached !== undefined) return cached;

  const features = noteFeatures(text);
  let label: NoteLabel = "neutral";
  if (features.size > 0) {
    const model = loadWeights();
    const positive = fires(model, 0, features);
    const negative = fires(model, HEAD_LENGTH, features);
    label = positive && negative ? "mixed" : positive ? "positive" : negative ? "negative" : "neutral";
  }
  const lower = text.toLowerCase();
  const topics = TOPICS.filter(([, pattern]) => pattern.test(lower))
    .map(([topic]) => topic)
    .slice(0, 2);

  // Tables re-render the same notes often; an event has a few thousand at most.
  if (cache.size >= 5000) cache.clear();
  const insight = { label, topics };
  cache.set(text, insight);
  return insight;
}

export type NoteCounts = Record<NoteLabel, number> & { total: number };

/** Counts the labels of the non-blank notes. */
export function summarizeNotes(notes: (string | null | undefined)[]): NoteCounts {
  const counts: NoteCounts = { positive: 0, mixed: 0, negative: 0, neutral: 0, total: 0 };
  for (const note of notes) {
    const insight = classifyNote(note);
    if (!insight) continue;
    counts[insight.label]++;
    counts.total++;
  }
  return counts;
}
