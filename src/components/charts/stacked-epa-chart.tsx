"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useState } from "react";

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
import { EPABreakdown } from "@/lib/shared-types";
import { useIsMobile } from "@/hooks/use-mobile";

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

// Custom interactive legend component
function CustomLegend({ 
  visibleCategories, 
  onToggle 
}: { 
  visibleCategories: Record<string, boolean>;
  onToggle: (category: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {Object.entries(chartConfig).reverse().map(([key, config]) => {
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
                backgroundColor: isVisible ? config.color : 'transparent',
                border: isVisible ? 'none' : `1.5px solid ${config.color}`
              }}
            />
            <span 
              className="text-xs font-medium transition-all duration-200"
              style={{ 
                color: isVisible ? 'var(--foreground)' : 'var(--muted-foreground)',
                textDecoration: isVisible ? 'none' : 'line-through' 
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

export function StackedEPAChart({ data }: { data?: EPABreakdown[] }) {
  const displayData = data || [];
  const isMobile = useIsMobile();
  
  // State for toggling categories (all visible by default)
  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>({
    auto: true,
    teleop: true,
    endgame: true,
    penalties: true,
  });

  const toggleCategory = (category: string) => {
    setVisibleCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>EPA Graph</CardTitle>
        <CardDescription>
          {isMobile ? "Scroll horizontally • " : ""}Click legend items to toggle categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={isMobile ? "overflow-x-auto -mx-6 px-6" : ""}>
          <ChartContainer config={chartConfig} className={isMobile ? "min-w-[600px]" : ""}>
            <BarChart accessibilityLayer data={displayData} stackOffset="sign">
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="team"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.length > 4 ? value.slice(0, 4) + "..." : value}
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
        </ChartContainer>
        </div>
        <CustomLegend 
          visibleCategories={visibleCategories} 
          onToggle={toggleCategory} 
        />
      </CardContent>
    </Card>
  );
}