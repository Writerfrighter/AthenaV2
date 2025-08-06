// components/team-card-skeleton.tsx
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export function TeamCardSkeleton() {
  return (
    <Card className="max-w-sm w-full mx-auto animate-pulse">
      <CardHeader className="space-y-2">
        {/* Title placeholder */}
        <div className="h-6 bg-gray-200 dark:bg-gray-800/30 rounded w-1/2" />
        {/* Subtitle placeholder */}
        <div className="h-4 bg-gray-200 dark:bg-gray-800/30 rounded w-3/4" />
      </CardHeader>

      <CardContent>
        {/* Image placeholder */}
        <div className="h-48 bg-gray-200 dark:bg-gray-800/30 rounded-md" />
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {/* Button placeholders */}
        <div className="h-10 bg-gray-200 dark:bg-gray-800/30 rounded w-full" />
        <div className="h-10 bg-gray-200 dark:bg-gray-800/30 rounded w-full" />
      </CardFooter>
    </Card>
  );
}
