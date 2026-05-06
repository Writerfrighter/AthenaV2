"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  ErrorBar,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
type TeamEPAChartDatum = {
  team: string;
  auto: number;
  teleop: number;
  endgame: number;
  penalties: number;
  totalEPA: number;
  totalEPAStats?: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
  };
};
import { useIsMobile } from "@/hooks/use-mobile";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Define types for better type safety
interface TooltipPayload {
  dataKey: string;
  name: string;
  value: number;
  color: string;
  payload: Record<string, unknown>;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

interface BoxPlotDatum {
  category: string;
  color: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  range: [number, number];
}

// Custom tooltip content to include total
function CustomChartTooltipContent(props: TooltipProps) {
  const { active, payload, label } = props;
  if (!active || !payload || !payload.length) return null;

  // Type the payload properly
  const data = payload[0]?.payload as { totalEPA?: number };
  const total = typeof data?.totalEPA === "number" ? data.totalEPA : 0;

  return (
    <div className="p-2 bg-background rounded-md shadow-md border">
      <div className="font-semibold mb-1">Team: {label}</div>
      {payload.map((entry: TooltipPayload) => (
        <div key={entry.dataKey} className="flex justify-between gap-2">
          <span style={{ color: entry.color }}>{entry.name}:</span>
          <span>
            {typeof entry.value === "number"
              ? entry.value.toFixed(3)
              : entry.value}
          </span>
        </div>
      ))}
      <div className="flex justify-between gap-2 mt-2 font-bold">
        <span>Total:</span>
        <span>{total.toFixed(3)}</span>
      </div>
    </div>
  );
}

function BoxPlotTooltipContent(props: TooltipProps) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload as unknown as BoxPlotDatum | undefined;
  if (!data) return null;

  return (
    <div className="p-2 bg-background rounded-md shadow-md border">
      <div className="font-semibold mb-1">{data.category}</div>
      <div className="flex justify-between gap-2">
        <span>Min:</span>
        <span>{data.min.toFixed(3)}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span>Q1:</span>
        <span>{data.q1.toFixed(3)}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span>Median:</span>
        <span>{data.median.toFixed(3)}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span>Q3:</span>
        <span>{data.q3.toFixed(3)}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span>Max:</span>
        <span>{data.max.toFixed(3)}</span>
      </div>
    </div>
  );
}

export const description = "A stacked bar chart with a legend";

const chartConfig = {
  penalties: {
    label: "Penalties",
    color: "var(--chart-1)",
  },
  endgame: {
    label: "Endgame",
    color: "var(--chart-2)",
  },
  teleop: {
    label: "Teleop",
    color: "var(--chart-3)",
  },
  auto: {
    label: "Auto",
    color: "var(--chart-4)",
  },
  total: {
    label: "Total",
    color: "var(--chart-5)",
  },
};

const buildBoxPlotData = (data: TeamEPAChartDatum[]) =>
  data.map((entry) => {
    const stats = entry.totalEPAStats;
    const min = stats?.min ?? entry.totalEPA;
    const q1 = stats?.q1 ?? entry.totalEPA;
    const median = stats?.median ?? entry.totalEPA;
    const q3 = stats?.q3 ?? entry.totalEPA;
    const max = stats?.max ?? entry.totalEPA;
    const iqr = q3 - q1;
    const range: [number, number] = [median - min, max - median];

    return {
      category: entry.team,
      color: "var(--color-total)",
      min,
      q1,
      median,
      q3,
      max,
      iqr,
      range,
    } satisfies BoxPlotDatum;
  });

function MedianTick(props: { cx?: number; cy?: number; payload?: BoxPlotDatum }) {
  const { cx, cy, payload } = props;
  if (!payload || cx === undefined || cy === undefined) return null;

  const width = 28;
  return (
    <line
      x1={cx - width / 2}
      x2={cx + width / 2}
      y1={cy}
      y2={cy}
      stroke={payload.color}
      strokeWidth={2}
    />
  );
}

// Custom interactive legend component
function CustomLegend({
  visibleCategories,
  onToggle,
}: {
  visibleCategories: Record<string, boolean>;
  onToggle: (category: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {Object.entries(chartConfig)
        .filter(([key]) => key !== "total")
        .reverse()
        .map(([key, config]) => {
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
                  color: isVisible
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
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

export function StackedEPAChart({ data }: { data?: TeamEPAChartDatum[] }) {
  const displayData = data || [];
  const isMobile = useIsMobile();
  const [chartView, setChartView] = useState<"stacked" | "box">("stacked");

  // State for toggling categories (all visible by default)
  const [visibleCategories, setVisibleCategories] = useState<
    Record<string, boolean>
  >({
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

  const boxPlotData = useMemo(
    () => buildBoxPlotData(displayData),
    [displayData],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>EPA Graph</CardTitle>
            <CardDescription>
              {chartView === "stacked"
                ? `${isMobile ? "Scroll horizontally • " : ""}Click legend items to toggle categories`
                : "Total EPA distribution per team"}
            </CardDescription>
          </div>
          <ToggleGroup
            type="single"
            value={chartView}
            onValueChange={(value) => {
              if (value === "stacked" || value === "box") {
                setChartView(value);
              }
            }}
            size="sm"
            variant="outline"
            spacing={0}
          >
            <ToggleGroupItem value="stacked">Stacked</ToggleGroupItem>
            <ToggleGroupItem value="box">Box & Whisker</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className={isMobile ? "overflow-x-auto -mx-6 px-6" : ""}>
          <ChartContainer
            config={chartConfig}
            className={isMobile ? "min-w-[600px]" : ""}
          >
            {chartView === "stacked" ? (
              <BarChart accessibilityLayer data={displayData} stackOffset="sign">
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="team"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) =>
                    value.length > 4 ? value.slice(0, 4) + "..." : value
                  }
                />
                <ChartTooltip content={<CustomChartTooltipContent />} />
                {visibleCategories.penalties && (
                  <Bar
                    dataKey="penalties"
                    stackId="a"
                    fill="var(--color-penalties)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={300}
                  />
                )}
                {visibleCategories.endgame && (
                  <Bar
                    dataKey="endgame"
                    stackId="a"
                    fill="var(--color-endgame)"
                    radius={[0, 0, 0, 0]}
                    animationDuration={300}
                  />
                )}
                {visibleCategories.teleop && (
                  <Bar
                    dataKey="teleop"
                    stackId="a"
                    fill="var(--color-teleop)"
                    radius={[0, 0, 0, 0]}
                    animationDuration={300}
                  />
                )}
                {visibleCategories.auto && (
                  <Bar
                    dataKey="auto"
                    stackId="a"
                    fill="var(--color-auto)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={300}
                  />
                )}
                <XAxis />
                <YAxis />
              </BarChart>
            ) : (
              <ComposedChart accessibilityLayer data={boxPlotData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) =>
                    value.length > 4 ? value.slice(0, 4) + "..." : value
                  }
                />
                <YAxis />
                <ChartTooltip content={<BoxPlotTooltipContent />} />
                <Bar
                  dataKey="q1"
                  stackId="box"
                  fill="transparent"
                  stroke="transparent"
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="iqr"
                  stackId="box"
                  fill="var(--color-total)"
                  fillOpacity={0.25}
                  stroke="var(--color-total)"
                  strokeWidth={2}
                  radius={4}
                  isAnimationActive={false}
                />
                <Scatter
                  dataKey="median"
                  fill="transparent"
                  stroke="transparent"
                  shape={(props: { cx?: number; cy?: number; payload?: BoxPlotDatum }) => (
                    <MedianTick {...props} />
                  )}
                >
                  <ErrorBar dataKey="range" stroke="var(--color-total)" direction="y" />
                </Scatter>
              </ComposedChart>
            )}
          </ChartContainer>
        </div>
        {chartView === "stacked" && (
          <CustomLegend
            visibleCategories={visibleCategories}
            onToggle={toggleCategory}
          />
        )}
      </CardContent>
    </Card>
  );
}
