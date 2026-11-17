"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/light-dark-toggle";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { DynamicMatchScoutForm } from "@/components/forms/dynamic-match-scout-form";
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
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Exit
          </Link>
          <h1 className="font-mono text-[13px] text-muted-foreground">
            match scouting{selectedEvent ? ` · ${selectedEvent.name}` : ""}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <OfflineStatusWidget />
            <ModeToggle />
            <ThemeSelector />
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
                Match entries must be attached to an event so schedules and teams can be filled correctly.
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
          <DynamicMatchScoutForm />
        </Suspense>
      )}
    </div>
  );
}
