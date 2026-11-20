"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { NOTE_LABELS, NoteTags } from "@/components/note-sentiment";
import { classifyNote, summarizeNotes, type NoteLabel } from "@/lib/note-sentiment";
import { useSession } from "next-auth/react";

interface TeamNotesProps {
  notes: string[];
  searchNote: string;
  setSearchNote: (val: string) => void;
}

const FILTERS: NoteLabel[] = ["positive", "mixed", "negative", "neutral"];

export function TeamNotes({
  notes,
  searchNote,
  setSearchNote,
}: TeamNotesProps) {
  const { data: session } = useSession();
  const [label, setLabel] = useState<NoteLabel | null>(null);
  const counts = summarizeNotes(notes);
  const filtered = notes.filter(
    (n) =>
      n.toLowerCase().includes(searchNote.toLowerCase()) &&
      (!label || classifyNote(n)?.label === label),
  );
  if (session?.guestEvent && !session.guestEvent.canViewNotes) return null;

  return (
    <section aria-labelledby="scout-notes" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="scout-notes" className="text-lg font-semibold tracking-tight">
          Scouting notes · {notes.length}
        </h2>
        <Input
          type="search"
          aria-label="Search notes"
          placeholder="Search notes…"
          value={searchNote}
          onChange={(e) => setSearchNote(e.target.value)}
          className="w-56 rounded-full bg-card"
        />
      </div>
      {counts.total > 0 && (
        <div role="group" aria-label="Filter notes by label" className="flex flex-wrap items-center gap-1 text-sm">
          <button
            type="button"
            aria-pressed={!label}
            onClick={() => setLabel(null)}
            className={`rounded-full px-3 py-1 ${!label ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            All
          </button>
          {FILTERS.filter((key) => counts[key] > 0).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={label === key}
              onClick={() => setLabel(label === key ? null : key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${label === key ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span aria-hidden="true" className={`size-2 rounded-full ${NOTE_LABELS[key].dot}`} />
              {NOTE_LABELS[key].name} {counts[key]}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">Labels are automatic and can be wrong</span>
        </div>
      )}
      <div className="max-h-80 overflow-y-auto border-t">
        {filtered.length > 0 ? (
          filtered.map((note, index) => (
            <div key={index} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border/60 py-2.5 text-sm leading-relaxed">
              <p className="min-w-0 flex-1 basis-64">{note}</p>
              <NoteTags note={note} />
            </div>
          ))
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {notes.length === 0
              ? "No scouting notes available for this team yet."
              : "No notes match your search."}
          </p>
        )}
      </div>
    </section>
  );
}

export default TeamNotes;
