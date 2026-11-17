"use client";

import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { AdminAccessDenied } from "@/components/auth/admin-access-denied";
import { GameConfigStudio } from "@/components/settings/game-config-studio";
import { PERMISSIONS } from "@/lib/auth/roles";

export default function GameConfigAdminPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-xs text-muted-foreground">admin · game configuration</span>
        <h1 className="text-[44px] font-bold leading-[0.95] tracking-[-0.04em]">Game configuration</h1>
        <p className="text-muted-foreground">
          Design each season&apos;s scouting forms, matchup card, team page and analysis.
        </p>
      </header>

      <PermissionGuard
        permissions={[
          PERMISSIONS.MANAGE_GAME_CONFIG,
          PERMISSIONS.MANAGE_SYSTEM_CONFIG,
        ]}
        fallback={
          <AdminAccessDenied
            title="Game Configuration Restricted"
            description="You must have administrator permissions to create or modify game configurations."
          />
        }
      >
        <GameConfigStudio />
      </PermissionGuard>
    </div>
  );
}
