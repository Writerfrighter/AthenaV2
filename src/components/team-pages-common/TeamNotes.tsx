"use client";

import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

interface TeamNotesProps {
  notes: string[];
  searchNote: string;
  setSearchNote: (val: string) => void;
}

export function TeamNotes({
  notes,
  searchNote,
  setSearchNote,
}: TeamNotesProps) {
  const { data: session } = useSession();
  const filtered = notes.filter((n) =>
    n.toLowerCase().includes(searchNote.toLowerCase()),
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
      <div className="max-h-80 overflow-y-auto border-t">
        {filtered.length > 0 ? (
          filtered.map((note, index) => (
            <p key={index} className="border-b border-border/60 py-2.5 text-sm leading-relaxed">
              {note}
            </p>
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
