import { TeamCardSkeleton } from "@/components/team-card-skeleton";

// app/dashboard/teamlist/loading.tsx
export default function Page() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
      {Array.from({ length: 25 }).map((_, i) => (
        <div key={i} className="space-y-2 animate-pulse">
          <TeamCardSkeleton />
        </div>
      ))}
    </div>
  );
}
