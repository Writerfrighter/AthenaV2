"use client";

import React, { useState } from "react";
import type { YearConfig, TeamPageConfig } from "@/lib/types";
import { buildPreviewTeamData } from "@/lib/game-config/preview-stats";
import { ConfigurableTeamPage } from "@/components/team-pages/configurable-team-page";
import { buildTeamPageDefaults } from "@/lib/game-config/team-page-defaults";
import { cn } from "@/lib/utils";
import { TeamPageInspector, type TeamPageSection } from "./team-page-inspector";
import { heading, hint, panel } from "./fields";

const SECTIONS: [TeamPageSection, string][] = [
  ["kpi", "Key numbers"],
  ["autoPerformance", "Autonomous performance"],
  ["teleopPerformance", "Teleop performance"],
  ["chart", "Scoring breakdown chart"],
  ["endgame", "Endgame"],
  ["penalties", "Penalties and fouls"],
  ["custom", "Custom sections"],
];

export function VisualTeamPageCanvas({ config, year, onUpdateConfig }: {
  config: YearConfig;
  year: number;
  onUpdateConfig: (updater: (prev: YearConfig) => YearConfig) => void;
}) {
  const [selectedSection, setSelectedSection] = useState<TeamPageSection>("kpi");
  const previewTeamData = React.useMemo(() => buildPreviewTeamData(config), [config]);
  const teamPageConfig = config.teamPageConfig ?? buildTeamPageDefaults(config);

  const updateTeamPage = (patch: Partial<TeamPageConfig>) =>
    onUpdateConfig((prev) => ({
      ...prev,
      teamPageConfig: { ...(prev.teamPageConfig || teamPageConfig), ...patch },
    }));

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
      <nav aria-label="Team page sections" className={panel}>
        <h2 className={`${heading} mb-2`}>Sections</h2>
        {SECTIONS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-current={selectedSection === id}
            onClick={() => setSelectedSection(id)}
            className={cn(
              "block w-full border-t py-2 text-left text-sm transition-colors",
              selectedSection === id ? "font-semibold" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 space-y-2">
        <p className={hint}>Preview with sample data.</p>
        <div className="max-h-[1100px] overflow-y-auto rounded-xl border p-4">
          <ConfigurableTeamPage
            teamNumber={String(previewTeamData.teamNumber)}
            yearOverride={year}
            configOverride={{ ...config, teamPageConfig }}
            teamDataOverride={previewTeamData}
          />
        </div>
      </div>

      <div className={`${panel} min-w-0 space-y-3`}>
        <h2 className={heading}>{SECTIONS.find(([id]) => id === selectedSection)?.[1]}</h2>
        <TeamPageInspector
          section={selectedSection}
          config={config}
          value={teamPageConfig}
          onChange={updateTeamPage}
        />
      </div>
    </div>
  );
}
