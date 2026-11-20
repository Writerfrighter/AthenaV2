import { describe, expect, it } from "vitest";
import { classifyNote, summarizeNotes } from "@/lib/note-sentiment";

/**
 * The note model runs inline while tables render, so a label has to cost
 * next to nothing. classifyNote caches by note text, so every timed note
 * below is unique or the numbers would only measure the cache.
 *
 * Measured on a dev laptop: ~9 ms cold start, ~15 µs median and ~40 µs p95
 * per note. The limits leave roughly 5-10x headroom for slow CI machines.
 */
const SAMPLE_NOTES = [
  "great climb, fast cycles",
  "intake jams on bounced fuel and they tipped in auto",
  "decent defense but slow driver, missed a lot of shots",
  "robot died halfway through the match",
  "really consistent scoring and cycles",
  "got a yellow card after the auto, then parked",
];

let uniqueId = 0;
const uniqueNote = () => `${SAMPLE_NOTES[uniqueId % SAMPLE_NOTES.length]} #${uniqueId++}`;

function time(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

describe("scouting note model speed", () => {
  // Must run first in this file: vitest gives each file a fresh module, so
  // this is the only call that pays for decoding the bundled weights.
  it("loads the weights and labels the first note quickly", () => {
    let insight: ReturnType<typeof classifyNote> = null;
    const elapsed = time(() => {
      insight = classifyNote(uniqueNote());
    });
    expect(insight).not.toBeNull();
    expect(elapsed).toBeLessThan(100);
  });

  it("labels a new note in microseconds", () => {
    for (let i = 0; i < 200; i++) classifyNote(uniqueNote()); // warm up the JIT

    const samples: number[] = [];
    for (let i = 0; i < 2000; i++) {
      const note = uniqueNote();
      samples.push(time(() => classifyNote(note)));
    }
    samples.sort((a, b) => a - b);

    expect(percentile(samples, 0.5)).toBeLessThan(0.1);
    expect(percentile(samples, 0.95)).toBeLessThan(0.5);
  });

  it("stays fast on a note at the length cap", () => {
    const longNote = "great robot, scored a lot of fuel but jammed once. ".repeat(60);
    expect(longNote.length).toBeGreaterThan(2000);
    expect(time(() => classifyNote(longNote))).toBeLessThan(5);
  });

  it("returns a repeat note from the cache", () => {
    const note = uniqueNote();
    const first = classifyNote(note);
    expect(classifyNote(note)).toBe(first);

    const elapsed = time(() => {
      for (let i = 0; i < 10_000; i++) classifyNote(note);
    });
    expect(elapsed / 10_000).toBeLessThan(0.01);
  });

  it("summarizes an event's worth of new notes quickly", () => {
    const notes = Array.from({ length: 1000 }, uniqueNote);
    let total = 0;
    const elapsed = time(() => {
      total = summarizeNotes(notes).total;
    });
    expect(total).toBe(1000);
    expect(elapsed).toBeLessThan(100);
  });
});
