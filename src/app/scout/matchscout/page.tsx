'use client';

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/ui/light-dark-toggle";
import { YearSelector } from "@/components/year-selector";
import { DynamicMatchScoutForm } from "@/components/dynamic-match-scout-form";
import { OfflineStatusWidget } from "@/components/offline-status-widget";
import { useSelectedEvent } from "@/hooks/use-event-config";
import Link from "next/link";

export default function Page() {
  const selectedEvent = useSelectedEvent();

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Header Bar */}
      <div className="bg-white/80 dark:bg-background/80 border-b top-0 z-50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
              <div className="h-6 w-px bg-border"></div>
              <h1 className="text-lg font-semibold dark:text-white">Match Scouting</h1>
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
            </div>
          </div>
          {/* Year selector on second row for mobile */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-3">
              <YearSelector />
              {selectedEvent && (
                <Badge variant="outline" className="text-xs hidden sm:block">
                  {selectedEvent.name}
                </Badge>
              )}
            </div>
            <OfflineStatusWidget />
          </div>
        </div>
      </div>

      <DynamicMatchScoutForm />
    </div>
  );
}
