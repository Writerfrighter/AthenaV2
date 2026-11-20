import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { writePrivateFile } from "./private-file";
import { join } from "node:path";
import type { DatabaseConfig } from "@/lib/types";

const directory = join(/* turbopackIgnore: true */ process.cwd(), ".runtime");
const path = join(/* turbopackIgnore: true */ directory, "setup-completion.json");
let memory: { fingerprint: string; complete: boolean } | undefined;

function fingerprint(config: DatabaseConfig): string {
  // Tie the marker to the database configuration without storing credentials.
  return createHash("sha256").update(JSON.stringify(config)).digest("hex");
}

export function hasSavedSetupCompletion(config: DatabaseConfig): boolean {
  const key = fingerprint(config);
  if (memory?.fingerprint === key) return memory.complete;
  try {
    const saved = JSON.parse(readFileSync(/* turbopackIgnore: true */ path, "utf8"));
    return saved.fingerprint === key && saved.complete === true;
  } catch {
    return false;
  }
}

export async function saveSetupCompletion(
  config: DatabaseConfig,
  complete: boolean,
): Promise<void> {
  const state = { fingerprint: fingerprint(config), complete };
  if (memory?.fingerprint === state.fingerprint && memory.complete === complete) return;
  memory = state;
  try {
    await mkdir(directory, { recursive: true });
    await writePrivateFile(path, `${JSON.stringify(state)}\n`);
  } catch (error) {
    // Keep the in-process marker on read-only deployments. A restart there
    // requires one fresh verification, rather than querying on every visit.
    console.warn("Unable to persist setup completion:", error);
  }
}
