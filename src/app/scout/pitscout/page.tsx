'use client';

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/light-dark-toggle";
import { YearSelector } from "@/components/year-selector";
import { DynamicPitScoutForm } from "@/components/dynamic-pit-scout-form";
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Header Bar */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50">
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
          <div className="mt-2 pt-2 border-t border-border/50">
            <YearSelector />
          </div>
        </div>
      </div>

      <DynamicPitScoutForm />
    </div>
  );
}
