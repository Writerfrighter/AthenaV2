"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";

import React from "react";
import { EPABreakdown } from "@/lib/shared-types";

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
          <span>{typeof entry.value === "number" ? entry.value.toFixed(3) : entry.value}</span>
        </div>
      ))}
      <div className="flex justify-between gap-2 mt-2 font-bold">
        <span>Total:</span>
        <span>{total.toFixed(3)}</span>
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
};

export function StackedEPAChart({ data }: { data?: EPABreakdown[] }) {
  const displayData = data || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>EPA Graph</CardTitle>
        <CardDescription>{}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={displayData} stackOffset="sign" >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="team"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.length > 4 ? value.slice(0, 4) + "..." : value}
            />
            <ChartTooltip content={<CustomChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="penalties"
              stackId="a"
              fill="var(--color-penalties)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="endgame"
              stackId="a"
              fill="var(--color-endgame)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="teleop"
              stackId="a"
              fill="var(--color-teleop)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="auto"
              stackId="a"
              fill="var(--color-auto)"
              radius={[4, 4, 0, 0]}
            />
            <XAxis />
            <YAxis />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
