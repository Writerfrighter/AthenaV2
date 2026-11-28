import { describe, expect, it } from "vitest";
import { buildAiPrompt, buildFixPrompt, extractJson } from "@/components/settings/game-config-studio/ai-prompt";
import { DEFAULT_NEW_CONFIG } from "@/components/settings/game-config-studio/types";
import { validateYearConfig } from "@/lib/game-config/config-validator";

const config = { ...DEFAULT_NEW_CONFIG, fieldImage: "data:image/png;base64,AAAA" };

describe("AI draft prompt", () => {
  it("asks clarifying questions before any JSON, and carries the manual, notes and current config", () => {
    const prompt = buildAiPrompt({
      config, year: 2027, manualUrl: " https://example.org/manual.pdf ", notes: "We have 4 scouts", startFromCurrent: true,
    });
    expect(prompt).toContain("https://example.org/manual.pdf");
    expect(prompt).toContain("We have 4 scouts");
    expect(prompt).toContain("FIRST, before writing any JSON, ask me clarifying questions");
    expect(prompt).toContain("STOP and wait for my answers");
    expect(prompt).toContain('"game_piece_scored"');
    // The image is useless to the AI and would swamp the prompt.
    expect(prompt).not.toContain("data:image");
  });

  it("asks for the manual when no link is given", () => {
    const prompt = buildAiPrompt({ config, year: 2027, startFromCurrent: false });
    expect(prompt).toContain("official FRC 2027 game manual");
    expect(prompt).toContain("Do not guess point values");
    expect(prompt).not.toContain("## What I want");
  });

  it("reads JSON out of a chat reply, fenced or not", () => {
    const json = JSON.stringify(DEFAULT_NEW_CONFIG);
    const fenced = extractJson(`Here you go:\n\`\`\`json\n${json}\n\`\`\`\nLet me know!`);
    expect(validateYearConfig(fenced).valid).toBe(true);
    expect(extractJson(`Sure. ${json} Done.`)).toEqual(DEFAULT_NEW_CONFIG);
    expect(() => extractJson("What scouts do you have?")).toThrow(/No JSON object/);
  });

  it("turns validation errors into a follow-up prompt", () => {
    expect(buildFixPrompt(["Missing 'gameName'."])).toMatch(/- Missing 'gameName'\.$/);
  });
});
