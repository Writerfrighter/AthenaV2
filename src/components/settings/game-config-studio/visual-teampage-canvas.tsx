"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard,
  BarChart3,
  Activity,
  Trophy,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import type { YearConfig, TeamPageConfig } from "@/lib/types";
import { buildDatapointRegistry } from "@/lib/game-config/datapoint-registry";
import { buildPreviewTeamData } from "@/lib/game-config/preview-stats";
import { ConfigurableTeamPage } from "@/components/team-pages/configurable-team-page";
import { DatapointPicker } from "./datapoint-picker";

interface VisualTeamPageCanvasProps {
  config: YearConfig;
  onUpdateConfig: (updater: (prev: YearConfig) => YearConfig) => void;
}

export function VisualTeamPageCanvas({
  config,
  onUpdateConfig,
}: VisualTeamPageCanvasProps) {
  const [selectedSection, setSelectedSection] = useState<"kpi" | "chart" | "endgame" | "penalties">("kpi");
  const [selectedChartItemIdx, setSelectedChartItemIdx] = useState<number | null>(null);
  const datapoints = React.useMemo(
    () => buildDatapointRegistry(config),
    [config],
  );
  const enumDatapoints = React.useMemo(
    () => datapoints.filter((d) => d.valueType === "enum" && !d.pitSection),
    [datapoints],
  );
  const previewTeamData = React.useMemo(
    () => buildPreviewTeamData(config),
    [config],
  );

  const teamPageConfig: TeamPageConfig = config.teamPageConfig || {
    kpis: {
      auto: {
        key: "autonomous.fuel_scored",
        label: "Avg Fuel (Auto)",
        subKey: "autonomous.climb",
        subLabel: "Climb rate",
        subFormat: "percent",
        icon: "Activity",
      },
      teleop: {
        key: "teleop.fuel_scored",
        label: "Avg Fuel Scored",
        subKey: "teleop.fuel_accuracy",
        subLabel: "Accuracy",
        subFormat: "percent",
        icon: "Flame",
      },
    },
    autoPerformance: { metrics: [], showPointsEstimate: true },
    teleopPerformance: { metrics: [], showPointsEstimate: true },
    scoringBreakdownChart: {
      title: "Fuel Scoring Breakdown",
      description: "Average fuel actions per match",
      items: [
        { name: "Auto Scored", key: "autonomous.fuel_scored", fill: "#f97316" },
        { name: "Auto Missed", key: "autonomous.fuel_missed", fill: "#fdba74" },
        { name: "Teleop Scored", key: "teleop.fuel_scored", fill: "#ef4444" },
        { name: "Teleop Passed", key: "teleop.fuel_passed", fill: "#3b82f6" },
      ],
    },
    endgame: {
      title: "Endgame Climb Distribution",
      description: "Percentage of matches at each climb level",
      displayType: "chart",
      stateKey: "endgame.ending_robot_state",
      states: [
        { value: "none", label: "None", points: 0 },
        { value: "L1", label: "L1", points: 10 },
        { value: "L2", label: "L2", points: 20 },
        { value: "L3", label: "L3", points: 30 },
      ],
    },
    penalties: {
      title: "Reliability & Penalties",
      description: "Robot reliability and penalty averages",
      minorKey: "fouls.fouls",
      minorLabel: "Avg Fouls per Match",
      minorPoints: -3,
      majorKey: "fouls.tech_fouls",
      majorLabel: "Avg Tech Fouls per Match",
      majorPoints: -10,
      techFoulAlertThreshold: 0.5,
      breakdownAlertThreshold: 20,
    },
  };

  const updateTeamPage = (patch: Partial<TeamPageConfig>) => {
    onUpdateConfig((prev) => ({
      ...prev,
      teamPageConfig: {
        ...(prev.teamPageConfig || teamPageConfig),
        ...patch,
      },
    }));
  };

  const handleAddChartItem = () => {
    const defaultColors = ["#f97316", "#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#14b8a6"];
    const existingItems = teamPageConfig.scoringBreakdownChart?.items || [];
    const color = defaultColors[existingItems.length % defaultColors.length];

    const newItem = {
      name: `Category ${existingItems.length + 1}`,
      key: "teleop.fuel_scored",
      fill: color,
    };

    updateTeamPage({
      scoringBreakdownChart: {
        ...teamPageConfig.scoringBreakdownChart,
        title: teamPageConfig.scoringBreakdownChart?.title || "Scoring Breakdown",
        description: teamPageConfig.scoringBreakdownChart?.description || "",
        items: [...existingItems, newItem],
      },
    });
    setSelectedChartItemIdx(existingItems.length);
    setSelectedSection("chart");
  };

  const handleRemoveChartItem = (idx: number) => {
    const existingItems = teamPageConfig.scoringBreakdownChart?.items || [];
    updateTeamPage({
      scoringBreakdownChart: {
        ...teamPageConfig.scoringBreakdownChart,
        title: teamPageConfig.scoringBreakdownChart?.title || "Scoring Breakdown",
        description: teamPageConfig.scoringBreakdownChart?.description || "",
        items: existingItems.filter((_, i) => i !== idx),
      },
    });
    if (selectedChartItemIdx === idx) setSelectedChartItemIdx(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Quick Actions & Elements (3 cols) */}
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <LayoutDashboard className="h-4 w-4 text-primary" />
              Team Page Designer
            </CardTitle>
            <CardDescription className="text-xs">
              Configure how team performance widgets, KPIs, charts, and penalties appear on profile pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Select Section to Edit
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <Button
                  size="sm"
                  variant={selectedSection === "kpi" ? "default" : "outline"}
                  onClick={() => setSelectedSection("kpi")}
                  className="justify-start text-xs h-8"
                >
                  <Activity className="h-3.5 w-3.5 mr-2 text-primary" /> Primary KPIs
                </Button>
                <Button
                  size="sm"
                  variant={selectedSection === "chart" ? "default" : "outline"}
                  onClick={() => setSelectedSection("chart")}
                  className="justify-start text-xs h-8"
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-2 text-amber-500" /> Scoring Breakdown Chart
                </Button>
                <Button
                  size="sm"
                  variant={selectedSection === "endgame" ? "default" : "outline"}
                  onClick={() => setSelectedSection("endgame")}
                  className="justify-start text-xs h-8"
                >
                  <Trophy className="h-3.5 w-3.5 mr-2 text-purple-500" /> Endgame Distribution
                </Button>
                <Button
                  size="sm"
                  variant={selectedSection === "penalties" ? "default" : "outline"}
                  onClick={() => setSelectedSection("penalties")}
                  className="justify-start text-xs h-8"
                >
                  <ShieldAlert className="h-3.5 w-3.5 mr-2 text-rose-500" /> Penalties & Fouls
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Quick Actions
              </span>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={handleAddChartItem}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5 text-primary" /> Add Breakdown Chart Bar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Center Column: the real team page, rendered against preview data (6 cols) */}
      <div className="lg:col-span-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Live Team Page
            Preview
          </span>
          <Badge variant="outline" className="text-[10px]">
            Sample data
          </Badge>
        </div>
        <div className="rounded-xl border bg-background overflow-y-auto max-h-[1100px] p-4">
          <ConfigurableTeamPage
            teamNumber={String(previewTeamData.teamNumber)}
            configOverride={config}
            teamDataOverride={previewTeamData}
          />
        </div>
      </div>

      {/* Right Column: Property Inspector (3 cols) */}
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-primary" />
              Team Page Inspector
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Inspector for KPIs */}
            {selectedSection === "kpi" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-primary">Autonomous KPI</span>
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={teamPageConfig.kpis?.auto?.label || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateTeamPage({
                          kpis: {
                            ...teamPageConfig.kpis,
                            auto: { ...teamPageConfig.kpis?.auto, key: teamPageConfig.kpis?.auto?.key || "", label: val },
                            teleop: teamPageConfig.kpis?.teleop || { key: "", label: "" },
                          },
                        });
                      }}
                      className="h-8 text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Field</Label>
                    <DatapointPicker
                      datapoints={datapoints}
                      value={teamPageConfig.kpis?.auto?.key || ""}
                      onChange={(val) => {
                        updateTeamPage({
                          kpis: {
                            ...teamPageConfig.kpis,
                            auto: { ...teamPageConfig.kpis?.auto, label: teamPageConfig.kpis?.auto?.label || "", key: val },
                            teleop: teamPageConfig.kpis?.teleop || { key: "", label: "" },
                          },
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t">
                  <span className="text-xs font-bold text-amber-500">Teleoperated KPI</span>
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={teamPageConfig.kpis?.teleop?.label || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateTeamPage({
                          kpis: {
                            ...teamPageConfig.kpis,
                            auto: teamPageConfig.kpis?.auto || { key: "", label: "" },
                            teleop: { ...teamPageConfig.kpis?.teleop, key: teamPageConfig.kpis?.teleop?.key || "", label: val },
                          },
                        });
                      }}
                      className="h-8 text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Field</Label>
                    <DatapointPicker
                      datapoints={datapoints}
                      value={teamPageConfig.kpis?.teleop?.key || ""}
                      onChange={(val) => {
                        updateTeamPage({
                          kpis: {
                            ...teamPageConfig.kpis,
                            auto: teamPageConfig.kpis?.auto || { key: "", label: "" },
                            teleop: { ...teamPageConfig.kpis?.teleop, label: teamPageConfig.kpis?.teleop?.label || "", key: val },
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Inspector for Scoring Breakdown Chart */}
            {selectedSection === "chart" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs">Chart Title</Label>
                  <Input
                    value={teamPageConfig.scoringBreakdownChart?.title || ""}
                    onChange={(e) =>
                      updateTeamPage({
                        scoringBreakdownChart: {
                          ...teamPageConfig.scoringBreakdownChart,
                          items: teamPageConfig.scoringBreakdownChart?.items || [],
                          title: e.target.value,
                        },
                      })
                    }
                    className="h-8 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs">Chart Items & Colors</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(teamPageConfig.scoringBreakdownChart?.items || []).map((item, idx) => (
                      <div key={idx} className="p-2 bg-muted/40 rounded-lg border space-y-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={item.fill || "#3b82f6"}
                            onChange={(e) => {
                              const val = e.target.value;
                              const items = [...(teamPageConfig.scoringBreakdownChart?.items || [])];
                              items[idx] = { ...items[idx], fill: val };
                              updateTeamPage({
                                scoringBreakdownChart: {
                                  ...teamPageConfig.scoringBreakdownChart,
                                  title: teamPageConfig.scoringBreakdownChart?.title || "Scoring Breakdown",
                                  items,
                                },
                              });
                            }}
                            className="w-7 h-7 rounded border cursor-pointer shrink-0"
                          />
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              const items = [...(teamPageConfig.scoringBreakdownChart?.items || [])];
                              items[idx] = { ...items[idx], name: val };
                              updateTeamPage({
                                scoringBreakdownChart: {
                                  ...teamPageConfig.scoringBreakdownChart,
                                  title: teamPageConfig.scoringBreakdownChart?.title || "Scoring Breakdown",
                                  items,
                                },
                              });
                            }}
                            className="h-7 text-xs font-semibold flex-1"
                            placeholder="Item Name"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleRemoveChartItem(idx)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <DatapointPicker
                          datapoints={datapoints}
                          value={item.key}
                          onChange={(val) => {
                            const items = [...(teamPageConfig.scoringBreakdownChart?.items || [])];
                            items[idx] = { ...items[idx], key: val };
                            updateTeamPage({
                              scoringBreakdownChart: {
                                ...teamPageConfig.scoringBreakdownChart,
                                title: teamPageConfig.scoringBreakdownChart?.title || "Scoring Breakdown",
                                items,
                              },
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Inspector for Endgame */}
            {selectedSection === "endgame" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Endgame Title</Label>
                  <Input
                    value={teamPageConfig.endgame?.title || ""}
                    onChange={(e) =>
                      updateTeamPage({
                        endgame: {
                          ...teamPageConfig.endgame,
                          stateKey: teamPageConfig.endgame?.stateKey || "endgame.ending_robot_state",
                          states: teamPageConfig.endgame?.states || [],
                          title: e.target.value,
                        },
                      })
                    }
                    className="h-8 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Robot State Field</Label>
                  <DatapointPicker
                    datapoints={enumDatapoints}
                    placeholder="Select a multi-state field..."
                    value={teamPageConfig.endgame?.stateKey}
                    onChange={(val) =>
                      updateTeamPage({
                        endgame: {
                          ...teamPageConfig.endgame,
                          title: teamPageConfig.endgame?.title || "Endgame Distribution",
                          states: teamPageConfig.endgame?.states || [],
                          stateKey: val,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Inspector for Penalties */}
            {selectedSection === "penalties" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Minor Foul Deductions (pts)</Label>
                  <Input
                    type="number"
                    value={teamPageConfig.penalties?.minorPoints ?? -3}
                    onChange={(e) =>
                      updateTeamPage({
                        penalties: {
                          ...teamPageConfig.penalties,
                          title: teamPageConfig.penalties?.title || "Penalties",
                          description: "",
                          minorKey: teamPageConfig.penalties?.minorKey || "fouls.fouls",
                          minorLabel: teamPageConfig.penalties?.minorLabel || "Minor Fouls",
                          majorKey: teamPageConfig.penalties?.majorKey || "fouls.tech_fouls",
                          majorLabel: teamPageConfig.penalties?.majorLabel || "Tech Fouls",
                          majorPoints: teamPageConfig.penalties?.majorPoints ?? -10,
                          minorPoints: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Major Foul Deductions (pts)</Label>
                  <Input
                    type="number"
                    value={teamPageConfig.penalties?.majorPoints ?? -10}
                    onChange={(e) =>
                      updateTeamPage({
                        penalties: {
                          ...teamPageConfig.penalties,
                          title: teamPageConfig.penalties?.title || "Penalties",
                          description: "",
                          minorKey: teamPageConfig.penalties?.minorKey || "fouls.fouls",
                          minorLabel: teamPageConfig.penalties?.minorLabel || "Minor Fouls",
                          majorKey: teamPageConfig.penalties?.majorKey || "fouls.tech_fouls",
                          majorLabel: teamPageConfig.penalties?.majorLabel || "Tech Fouls",
                          minorPoints: teamPageConfig.penalties?.minorPoints ?? -3,
                          majorPoints: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
