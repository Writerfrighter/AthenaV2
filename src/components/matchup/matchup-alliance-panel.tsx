"use client";

import type { CompetitionType } from "@/lib/types";
import { ConfigurableMatchupCard } from "./configurable-matchup-card";

// Props for matchup card components
export interface MatchupCardProps {
  teamNumber: string;
  alliance: "red" | "blue";
}

interface MatchupAlliancePanelProps {
  alliance: "red" | "blue";
  teamNumbers: number[];
  currentYear: number;
  competitionType: CompetitionType;
}

export default function MatchupAlliancePanel({
  alliance,
  teamNumbers,
}: MatchupAlliancePanelProps) {
  const red = alliance === "red";

  return (
    <div className="flex flex-col gap-4">
      <h3 className={`border-b-2 pb-2 font-semibold ${red ? "border-[#E5484D] text-[#C2272D]" : "border-[#3B7BF6] text-[#2563EB]"}`}>
        {red ? "Red alliance" : "Blue alliance"} · {teamNumbers.length} robots
      </h3>
      {teamNumbers.map((teamNum) => (
        <ConfigurableMatchupCard
          key={teamNum}
          teamNumber={teamNum.toString()}
          alliance={alliance}
        />
      ))}
      {teamNumbers.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No teams assigned
        </p>
      )}
    </div>
  );
}
