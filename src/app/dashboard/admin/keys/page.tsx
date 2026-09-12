"use client";

import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { ApiKeysConfiguration } from "@/components/settings/api-keys-configuration";
import { PERMISSIONS } from "@/lib/auth/roles";

export default function Page() {
    return <>
        <PermissionGuard permission={PERMISSIONS.MANAGE_SYSTEM_CONFIG}>
            <ApiKeysConfiguration />
        </PermissionGuard>
    </>;
}