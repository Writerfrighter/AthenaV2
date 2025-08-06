import Dexie, { type EntityTable } from "dexie";

interface PitEntry {
  teamNumber: number;
  name: string;
  driveTrain: "Swerve" | "Mecanum" | "Tank";
  weight: number;
  length: number;
  width: number;
  [extra: string]: unknown
}

const db = new Dexie("PitDatabase") as Dexie & {
  pitEntries: EntityTable<PitEntry, "teamNumber">;
};

// Schema declaration:
db.version(1).stores({
  pitEntires:
    "teamNumber, name, drivetrain, weight, length, width, seasonSpecific",
});

export type { PitEntry };
export { db };
