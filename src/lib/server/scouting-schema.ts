import { NextResponse } from "next/server";
import { z } from "zod";
import { DRIVE_TRAINS } from "@/lib/types";

// Entries are stored as sent and returned on every list read, and guest links
// may create them, so every field is bounded well above what the forms produce.
const MAX_TEXT = 10_000;
const MAX_KEYS = 200;
const fewKeys = (data: Record<string, unknown>) => Object.keys(data).length <= MAX_KEYS;
const scalar = z.union([z.number().finite(), z.string().max(MAX_TEXT), z.boolean()]);
// Multiselect pit fields submit string arrays.
const value = z.union([scalar, z.array(scalar).max(MAX_KEYS)]);
const gameSpecificData = z.record(z.string().max(200), z.union([
  value, z.record(z.string().max(200), value).refine(fewKeys),
])).refine(fewKeys);
const common = {
  teamNumber: z.number().int().positive().max(999_999),
  year: z.number().int().min(1992).max(2100),
  competitionType: z.enum(["FRC", "FTC"]),
  eventName: z.string().max(200).optional(),
  eventCode: z.string().min(1).max(120).optional(),
  gameSpecificData,
};
const pitFields = z.object({
  ...common,
  driveTrain: z.enum(DRIVE_TRAINS),
  weight: z.number().finite().nonnegative().optional(),
  length: z.number().finite().nonnegative().optional(),
  width: z.number().finite().nonnegative().optional(),
  // Stroke JSON from the field drawing canvas.
  autoDrawing: z.string().max(500_000).optional(),
  notes: z.string().max(MAX_TEXT).optional(),
});
const matchFields = z.object({
  ...common,
  matchNumber: z.number().int().positive().max(500),
  alliance: z.enum(["red", "blue"]),
  alliancePosition: z.number().int().min(1).max(3).optional(),
  notes: z.string().max(MAX_TEXT),
  timestamp: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
});
const scoutingForUserId = z.string().min(1).optional();
export const createPitSchema = pitFields.extend({ scoutingForUserId });
export const createMatchSchema = matchFields.extend({ scoutingForUserId });
// Ownership is server-controlled. Updates accept only explicit editable fields.
export const updatePitSchema = pitFields.partial().extend({ id: z.number().int().positive() }).strict();
export const updateMatchSchema = matchFields.partial().extend({ id: z.number().int().positive() }).strict();

export async function parseScoutingBody<T>(request: Request, schema: z.ZodType<T>): Promise<
  | { data: T; error: null }
  | { data: null; error: NextResponse }
> {
  const body = await request.json().catch(() => undefined);
  const result = schema.safeParse(body);
  if (!result.success) return {
    data: null,
    error: NextResponse.json({ error: "Invalid scouting data", details: result.error.issues }, { status: 400 }),
  };
  return { data: result.data, error: null };
}
