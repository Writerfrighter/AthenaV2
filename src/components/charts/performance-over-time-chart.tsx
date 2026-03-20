"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { useState, useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MatchEntry, YearConfig } from "@/lib/shared-types";
import { calculateEPA } from "@/lib/statistics";

interface PerMatchEPA {
  matchNumber: number;
  auto: number;
  teleop: number;
  endgame: number;
  penalties: number;
  total: number;
}

interface TooltipPayload {
  dataKey: string;
  name: string;
  value: number;
  color: string;
  payload: PerMatchEPA;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltipContent(props: TooltipProps) {
  const { active, payload, label } = props;
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  const total = data?.total ?? 0;

  return (
    <div className="p-2 bg-background rounded-md shadow-md border">
      <div className="font-semibold mb-1">Qual {label}</div>
      {payload.map((entry: TooltipPayload) => (
        <div key={entry.dataKey} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}:</span>
          <span>{typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}</span>
        </div>
      ))}
      <div className="flex justify-between gap-4 mt-2 font-bold border-t pt-1">
        <span>Total:</span>
        <span>{total.toFixed(1)}</span>
      </div>
    </div>
  );
}

const chartConfig = {
  auto: {
    label: "Auto",
    color: "var(--chart-4)",
  },
  teleop: {
    label: "Teleop",
    color: "var(--chart-3)",
  },
  endgame: {
    label: "Endgame",
    color: "var(--chart-2)",
  },
  penalties: {
    label: "Penalties",
    color: "var(--chart-1)",
  },
};

function CustomLegend({
  visibleCategories,
  onToggle,
}: {
  visibleCategories: Record<string, boolean>;
  onToggle: (category: string) => void;
}) {
  const order: (keyof typeof chartConfig)[] = ["auto", "teleop", "endgame", "penalties"];
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {order.map((key) => {
        const config = chartConfig[key];
        const isVisible = visibleCategories[key];
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className="flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:opacity-80"
            style={{ opacity: isVisible ? 1 : 0.3 }}
          >
            <div
              className="w-2 h-2 rounded-[2px] transition-all duration-200"
              style={{
                backgroundColor: isVisible ? config.color : "transparent",
                border: isVisible ? "none" : `1.5px solid ${config.color}`,
              }}
            />
            <span
              className="text-xs font-medium transition-all duration-200"
              style={{
                color: isVisible ? "var(--foreground)" : "var(--muted-foreground)",
                textDecoration: isVisible ? "none" : "line-through",
              }}
            >
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface PerformanceOverTimeChartProps {
  matchEntries: MatchEntry[];
  yearConfig: YearConfig;
  year: number;
}

export function PerformanceOverTimeChart({
  matchEntries,
  yearConfig,
  year,
}: PerformanceOverTimeChartProps) {
  const isMobile = useIsMobile();

  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>({
    auto: true,
    teleop: true,
    endgame: true,
    penalties: true,
  });

  const toggleCategory = (category: string) => {
    setVisibleCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const chartData = useMemo(() => {
    if (!matchEntries || matchEntries.length === 0) return [];

    // Sort by match number ascending
    const sorted = [...matchEntries].sort((a, b) => a.matchNumber - b.matchNumber);

    return sorted.map((match) => {
      const epa = calculateEPA([match], year, yearConfig);
      return {
        matchNumber: match.matchNumber,
        auto: epa.auto,
        teleop: epa.teleop,
        endgame: epa.endgame,
        penalties: epa.penalties,
        total: epa.totalEPA,
      } satisfies PerMatchEPA;
    });
  }, [matchEntries, year, yearConfig]);

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Over Time</CardTitle>
        <CardDescription>
          {isMobile ? "Scroll horizontally • " : ""}
          Points scored per qualification match
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={isMobile ? "overflow-x-auto -mx-6 px-6" : ""}>
          <ChartContainer config={chartConfig} className={isMobile ? "min-w-[600px]" : ""}>
            <AreaChart
              accessibilityLayer
              data={chartData}
              stackOffset="sign"
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="matchNumber"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                label={{ value: "Qual Match", position: "insideBottom", offset: -5, className: "fill-muted-foreground text-xs" }}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<CustomTooltipContent />} />

              {visibleCategories.penalties && (
                <Area
                  dataKey="penalties"
                  stackId="1"
                  type="monotone"
                  fill="var(--color-penalties)"
                  stroke="var(--color-penalties)"
                  fillOpacity={0.4}
                  animationDuration={300}
                />
              )}
              {visibleCategories.endgame && (
                <Area
                  dataKey="endgame"
                  stackId="1"
                  type="monotone"
                  fill="var(--color-endgame)"
                  stroke="var(--color-endgame)"
                  fillOpacity={0.4}
                  animationDuration={300}
                />
              )}
              {visibleCategories.teleop && (
                <Area
                  dataKey="teleop"
                  stackId="1"
                  type="monotone"
                  fill="var(--color-teleop)"
                  stroke="var(--color-teleop)"
                  fillOpacity={0.4}
                  animationDuration={300}
                />
              )}
              {visibleCategories.auto && (
                <Area
                  dataKey="auto"
                  stackId="1"
                  type="monotone"
                  fill="var(--color-auto)"
                  stroke="var(--color-auto)"
                  fillOpacity={0.4}
                  animationDuration={300}
                />
              )}
            </AreaChart>
          </ChartContainer>
        </div>
        <CustomLegend visibleCategories={visibleCategories} onToggle={toggleCategory} />
      </CardContent>
    </Card>
  );
}
