"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/light-dark-toggle";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { DynamicPitScoutForm } from "@/components/forms/dynamic-pit-scout-form";
import { OfflineStatusWidget } from "@/components/sync/offline-status-widget";
import { useSelectedEvent } from "@/hooks/use-event-config";
import Link from "next/link";

export default function Page() {
  const selectedEvent = useSelectedEvent();

  return (
    <div className="scout-form-page min-h-screen bg-background dark:bg-background">
      <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] flex h-[3px]">
        <div className="flex-1 bg-[#E5484D]" />
        <div className="flex-1 bg-[#3B7BF6]" />
      </div>
      <header className="sticky top-0 z-50 border-b bg-background/95 pt-[3px] backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2">
          <Link href="/dashboard" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
            ← Exit
          </Link>
          <h1 className="min-w-0 flex-1 truncate font-mono text-[13px] text-muted-foreground">
            <span className="sr-only">pit scouting · </span>
            {selectedEvent?.name ?? "pit scouting"}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <OfflineStatusWidget />
            <ModeToggle />
            <div className="hidden sm:block"><ThemeSelector /></div>
          </div>
        </div>
      </header>

      {!selectedEvent ? (
        <div className="mx-auto max-w-2xl px-4 py-12">
          <Card className="rounded-2xl border-dashed text-center shadow-none">
            <CardHeader>
              <CardTitle>Select an event before scouting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pit entries must be attached to an event so the correct team list is available.
              </p>
              <Button asChild>
                <Link href="/dashboard">Choose an event</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="max-w-4xl mx-auto px-4 py-6 text-center">
              Loading...
            </div>
          }
        >
          <DynamicPitScoutForm />
        </Suspense>
      )}
    </div>
  );
}
