import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DatabaseConfig } from "@/lib/types";

const RUNTIME_DIR = join(process.cwd(), ".runtime");
const DATABASE_CONFIG_PATH = join(RUNTIME_DIR, "database-config.json");

export function loadPersistedDatabaseConfig(): DatabaseConfig | null {
  try {
    const raw = readFileSync(DATABASE_CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as DatabaseConfig;
    return parsed;
  } catch {
    return null;
  }
}

export async function savePersistedDatabaseConfig(config: DatabaseConfig) {
  await mkdir(RUNTIME_DIR, { recursive: true });
  await writeFile(
    DATABASE_CONFIG_PATH,
    `${JSON.stringify(config, null, 2)}\n`,
    "utf8",
  );
}

export { DATABASE_CONFIG_PATH };
