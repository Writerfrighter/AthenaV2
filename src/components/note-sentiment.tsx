import { classifyNote, summarizeNotes, type NoteLabel } from "@/lib/note-sentiment";

/** Shared look for auto-labeled scouting notes: teal, amber and red, as in the phase strip. */
export const NOTE_LABELS: Record<NoteLabel, { name: string; dot: string; text: string }> = {
  positive: { name: "Positive", dot: "bg-[#0D9488]", text: "text-teal-700 dark:text-teal-400" },
  mixed: { name: "Mixed", dot: "bg-[#B7791F]", text: "text-amber-700 dark:text-amber-400" },
  negative: { name: "Negative", dot: "bg-[#DC2626]", text: "text-red-700 dark:text-red-400" },
  neutral: { name: "Neutral", dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
};

const HINT = "Labeled automatically from the note text; it can be wrong.";

/** A dot for tight rows. Renders nothing for a blank note. */
export function NoteDot({ note, className = "" }: { note?: string | null; className?: string }) {
  const insight = classifyNote(note);
  if (!insight) return null;
  const style = NOTE_LABELS[insight.label];
  return (
    <span
      role="img"
      aria-label={`${style.name} note`}
      title={`${style.name} · ${HINT}`}
      className={`inline-block size-2 flex-none rounded-full ${style.dot} ${className}`}
    />
  );
}

/** Dot, label and topic chips for places with room to explain a note. */
export function NoteTags({ note }: { note?: string | null }) {
  const insight = classifyNote(note);
  if (!insight) return null;
  const style = NOTE_LABELS[insight.label];
  return (
    <span className="flex flex-none flex-wrap items-center gap-1.5 text-xs" title={HINT}>
      <span className={`flex items-center gap-1.5 font-medium ${style.text}`}>
        <span aria-hidden="true" className={`size-2 rounded-full ${style.dot}`} />
        {style.name}
      </span>
      {insight.topics.map((topic) => (
        <span key={topic} className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
          {topic}
        </span>
      ))}
    </span>
  );
}

/** Stacked bar of positive, mixed and negative notes with the note count. */
export function NotesBar({ notes }: { notes: (string | null | undefined)[] }) {
  const counts = summarizeNotes(notes);
  if (counts.total === 0) return <span className="text-muted-foreground">—</span>;
  const label = `${counts.positive} positive, ${counts.mixed} mixed, ${counts.negative} negative, ${counts.neutral} neutral notes`;
  return (
    <span role="img" aria-label={label} title={`${label} · ${HINT}`} className="flex items-center gap-2">
      <span className="flex h-1.5 w-14 gap-px overflow-hidden rounded-full bg-muted">
        {(["positive", "mixed", "negative"] as const).map(
          (key) =>
            counts[key] > 0 && (
              <span key={key} className={NOTE_LABELS[key].dot} style={{ flex: `${counts[key]} 1 0` }} />
            ),
        )}
        {counts.neutral > 0 && <span style={{ flex: `${counts.neutral} 1 0` }} />}
      </span>
      <span className="font-mono text-xs text-muted-foreground">{counts.total}</span>
    </span>
  );
}
