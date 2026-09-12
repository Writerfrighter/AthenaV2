"use client";

import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { CacheRevalidationComponent } from "@/components/cache-revalidation";
import { DataExportImportComponent } from "@/components/settings/data-export-import";
import { DatabaseConfigurationComponent } from "@/components/settings/database-configuration";
import { DatabaseResetComponent } from "@/components/settings/database-reset";
import { DatabaseSyncComponent } from "@/components/sync/database-sync";
import { OfflinePrecache } from "@/components/sync/offline-precache";
import { PERMISSIONS } from "@/lib/auth/roles";

export default function Page() {
    return <>
        <DatabaseSyncComponent />
        <PermissionGuard permission={PERMISSIONS.MANAGE_SYSTEM_CONFIG}>
            <DatabaseConfigurationComponent />
        </PermissionGuard>
        <OfflinePrecache />
        <PermissionGuard
        permissions={[PERMISSIONS.IMPORT_DATA, PERMISSIONS.EXPORT_DATA]}
        >
        <DataExportImportComponent />
        </PermissionGuard>
        <PermissionGuard permission={PERMISSIONS.REVALIDATE_CACHE}>
            <CacheRevalidationComponent />
        </PermissionGuard>
        <PermissionGuard permission={PERMISSIONS.RESET_DATABASE}>
            <DatabaseResetComponent />
        </PermissionGuard>
    </>;
}