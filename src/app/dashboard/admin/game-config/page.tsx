
"use client";

import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { GameConfigStudio } from "@/components/settings/game-config-studio/game-config-studio";
import { PERMISSIONS } from "@/lib/auth/roles";

export default function Page() {
    return <>
        <PermissionGuard
            permissions={[
                PERMISSIONS.MANAGE_GAME_CONFIG,
                PERMISSIONS.MANAGE_SYSTEM_CONFIG,
        ]}
        >
            <GameConfigStudio />
        </PermissionGuard>
    </>;
}
