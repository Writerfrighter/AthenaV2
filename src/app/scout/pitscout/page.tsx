'use client';

import { ArrowLeft, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/ui/light-dark-toggle";
import { YearSelector } from "@/components/year-selector";
import { DynamicPitScoutForm } from "@/components/dynamic-pit-scout-form";
import { useSelectedEvent } from "@/hooks/use-event-config";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Page() {
  const [isOnline, setIsOnline] = useState(true);
  const selectedEvent = useSelectedEvent();

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Set initial status
    updateOnlineStatus();
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);
  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Header Bar */}
      <div className="bg-white dark:bg-gray-800 border-b top-0 z-50">
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
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Pit Scouting</h1>
            </div>
            <ModeToggle />
          </div>
          {/* Year selector on second row */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-3">
              <YearSelector />
              {selectedEvent && (
                <Badge variant="outline" className="text-xs">
                  {selectedEvent.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-foreground" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <DynamicPitScoutForm />
    </div>
  );
}
