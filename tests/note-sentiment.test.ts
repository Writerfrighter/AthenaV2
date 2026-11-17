import { describe, expect, it } from "vitest";
import { classifyNote, summarizeNotes } from "@/lib/note-sentiment";

describe("scouting note labels", () => {
  it("has nothing to say about a blank note", () => {
    expect(classifyNote("")).toBeNull();
    expect(classifyNote("   ")).toBeNull();
    expect(classifyNote(undefined)).toBeNull();
  });

  it("labels clear praise and clear failures", () => {
    expect(classifyNote("great climb")?.label).toBe("positive");
    expect(classifyNote("really consistent scoring and cycles")?.label).toBe("positive");
    expect(
      classifyNote("couldn't do anything as their coral mechanism was completely wrecked.")?.label,
    ).toBe("negative");
  });

  it("tags the game areas a note mentions, at most two", () => {
    expect(classifyNote("great climb")?.topics).toEqual(["climb"]);
    expect(classifyNote("Intake jams on bounced fuel")?.topics).toEqual(["reliability", "intake"]);
    expect(classifyNote("got a yellow card after the auto, then tipped")?.topics).toHaveLength(2);
    expect(classifyNote("nice robot")?.topics).toEqual([]);
  });

  it("counts labels and skips blank notes", () => {
    const counts = summarizeNotes(["great climb", "", null, "great climb", "really consistent scoring and cycles"]);
    expect(counts).toMatchObject({ total: 3, positive: 3, negative: 0 });
  });
});
