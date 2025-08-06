"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A stacked bar chart with a legend";

export const chartData = [
  { team: "492", penalties: -4, endgame: 22, teleop: 36, auto: 28 },
  { team: "1318", penalties: -2, endgame: 19, teleop: 40, auto: 24 },
  { team: "2046", penalties: -6, endgame: 25, teleop: 30, auto: 20 },
  { team: "2471", penalties: -3, endgame: 18, teleop: 42, auto: 27 },
  { team: "3663", penalties: -5, endgame: 21, teleop: 34, auto: 26 },
  { team: "2910", penalties: -4, endgame: 24, teleop: 39, auto: 30 },
  { team: "948", penalties: -7, endgame: 20, teleop: 31, auto: 22 },
  { team: "5803", penalties: -2, endgame: 28, teleop: 35, auto: 25 },
  { team: "1983", penalties: -6, endgame: 26, teleop: 33, auto: 29 },
  { team: "360", penalties: -3, endgame: 17, teleop: 38, auto: 23 },
  { team: "368", penalties: -1, endgame: 15, teleop: 29, auto: 31 },
  { team: "1778", penalties: -5, endgame: 22, teleop: 36, auto: 20 },
  { team: "253", penalties: -3, endgame: 19, teleop: 34, auto: 28 },
  { team: "2147", penalties: -4, endgame: 23, teleop: 32, auto: 26 },
  { team: "2557", penalties: -2, endgame: 27, teleop: 37, auto: 24 },
  { team: "2811", penalties: -6, endgame: 16, teleop: 29, auto: 30 },
  { team: "3218", penalties: -4, endgame: 20, teleop: 35, auto: 22 },
  { team: "3502", penalties: -7, endgame: 25, teleop: 31, auto: 21 },
  { team: "3588", penalties: -1, endgame: 29, teleop: 40, auto: 19 },
  { team: "3711", penalties: -5, endgame: 18, teleop: 38, auto: 27 },
  { team: "4061", penalties: -3, endgame: 24, teleop: 33, auto: 23 },
  { team: "4125", penalties: -2, endgame: 20, teleop: 36, auto: 29 },
  { team: "4131", penalties: -6, endgame: 22, teleop: 30, auto: 26 },
  { team: "4180", penalties: -4, endgame: 27, teleop: 39, auto: 25 },
  { team: "488", penalties: -5, endgame: 21, teleop: 32, auto: 28 },
];


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
} satisfies ChartConfig;

export function StackedEPAChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>EPA Graph</CardTitle>
        <CardDescription>{}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} stackOffset="sign"  >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="team"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
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
      {/* <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter> */}
    </Card>
  );
}
