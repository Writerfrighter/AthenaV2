"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { OfflinePrecache } from "@/components/sync/offline-precache";
import { ROLES } from "@/lib/auth/roles";
import {
  Database,
  Users,
  KeyRound,
  FileJson,
  Bell,
  ArrowRight,
  Info,
  Shield,
  Layers,
} from "lucide-react";
import Link from "next/link";

const adminLinks = [
  {
    title: "Database & Sync",
    description: "Database connections, cloud sync, data export/import, cache revalidation, and maintenance.",
    href: "/dashboard/admin/database",
    icon: Database,
  },
  {
    title: "Team Management",
    description: "User accounts, role assignments, passwords, and open registration settings.",
    href: "/dashboard/admin/team",
    icon: Users,
  },
  {
    title: "Game Configuration",
    description: "Visual Game Config Studio for scoring definitions, canvas layouts, and custom formulas.",
    href: "/dashboard/admin/game-config",
    icon: FileJson,
  },
  {
    title: "API Keys",
    description: "Integration credentials for The Blue Alliance, FTC Events, and Nexus status APIs.",
    href: "/dashboard/admin/keys",
    icon: KeyRound,
  },
  {
    title: "Push Notifications",
    description: "Broadcast instant scouting alerts and shift assignments to team members.",
    href: "/dashboard/admin/notifications",
    icon: Bell,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings & System</h1>
        <p className="text-muted-foreground">
          System configuration, offline capabilities, and administration tools.
        </p>
      </div>

      {/* Admin Quick Links (Visible to Admin and Lead Scout) */}
      <PermissionGuard roles={[ROLES.ADMIN, ROLES.LEAD_SCOUT]}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Administration Sections</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                    <CardDescription className="text-xs pt-1.5 leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button asChild variant="outline" size="sm" className="w-full text-xs">
                      <Link href={item.href} className="flex items-center justify-center gap-1.5">
                        <span>Open {item.title}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </PermissionGuard>

      {/* Offline Pre-cache (Available to all scouts) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Offline Data Cache</h2>
        </div>
        <OfflinePrecache />
      </div>

      {/* About Athena V2 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle>About Athena V2</CardTitle>
          </div>
          <CardDescription>
            A high-performance, offline-first scouting and analytics system for FIRST Robotics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm">Version</h4>
            <p className="text-sm text-muted-foreground">2.0.0</p>
          </div>
          <div>
            <h4 className="font-medium text-sm">Features</h4>
            <ul className="text-sm text-muted-foreground space-y-1 mt-1">
              <li>• Year-configurable scouting forms and analytics</li>
              <li>• Multi-cloud database support (Azure SQL, MariaDB, Cosmos DB, Firestore)</li>
              <li>• Offline-first PWA with IndexedDB syncing</li>
              <li>• Advanced statistics, Scout Performance Ratings (SPR), and EPA calculations</li>
              <li>• Dynamic picklists and real-time matchup predictions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-sm">Supported Games</h4>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                FRC 2026 (REBUILT)
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                FRC 2025 (REEFSCAPE)
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                FTC 2026 (DECODE)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
