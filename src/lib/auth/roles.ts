export const ROLES = {
  ADMIN: "admin",
  LEAD_SCOUT: "lead_scout",
  SCOUT: "scout",
  VIEWER: "viewer",
  EXTERNAL: "external",
} as const;

export const PERMISSIONS = {
  // Dashboard & Overview
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_COMMENTS: "view_comments", // We hide this for EXTERNAL users due to GP issues

  // Scouting Operations
  CREATE_MATCH_SCOUTING: "create_match_scouting",
  EDIT_MATCH_SCOUTING: "edit_match_scouting",
  DELETE_MATCH_SCOUTING: "delete_match_scouting",
  VIEW_MATCH_SCOUTING: "view_match_scouting",

  CREATE_PIT_SCOUTING: "create_pit_scouting",
  EDIT_PIT_SCOUTING: "edit_pit_scouting",
  DELETE_PIT_SCOUTING: "delete_pit_scouting",
  VIEW_PIT_SCOUTING: "view_pit_scouting",

  // Picklist Management
  VIEW_PICKLIST: "view_picklist",
  EDIT_PICKLIST: "edit_picklist",

  // Event Management
  CONFIGURE_EVENTS: "configure_events",
  MANAGE_EVENT_SETTINGS: "manage_event_settings",

  // Data Management
  EXPORT_DATA: "export_data",
  IMPORT_DATA: "import_data",
  RESET_DATABASE: "reset_database",
  REVALIDATE_CACHE: "revalidate_cache",
  VIEW_DATA_DIAGNOSTICS: "view_data_diagnostics",

  // User Management
  VIEW_USERS: "view_users",
  CREATE_USERS: "create_users",
  EDIT_USERS: "edit_users",
  DELETE_USERS: "delete_users",
  MANAGE_USER_ROLES: "manage_user_roles",

  // System Settings
  VIEW_SETTINGS: "view_settings",
  EDIT_SETTINGS: "edit_settings",
  MANAGE_SYSTEM_CONFIG: "manage_system_config",

  // Advanced Features
  MANAGE_GAME_CONFIG: "manage_game_config",
  ACCESS_ADMIN_PANEL: "access_admin_panel",
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Full access to everything
    ...Object.values(PERMISSIONS),
  ],
  [ROLES.LEAD_SCOUT]: [
    // Scouting operations, is able to do almost everything except user management and system settings
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_COMMENTS,

    PERMISSIONS.CREATE_MATCH_SCOUTING,
    PERMISSIONS.EDIT_MATCH_SCOUTING,
    PERMISSIONS.DELETE_MATCH_SCOUTING,
    PERMISSIONS.VIEW_MATCH_SCOUTING,

    PERMISSIONS.CREATE_PIT_SCOUTING,
    PERMISSIONS.EDIT_PIT_SCOUTING,
    PERMISSIONS.DELETE_PIT_SCOUTING,
    PERMISSIONS.VIEW_PIT_SCOUTING,

    PERMISSIONS.VIEW_PICKLIST,
    PERMISSIONS.EDIT_PICKLIST,

    PERMISSIONS.CONFIGURE_EVENTS,
    PERMISSIONS.MANAGE_EVENT_SETTINGS,

    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.IMPORT_DATA,

    PERMISSIONS.VIEW_USERS,
  ],
  [ROLES.SCOUT]: [
    // Basic scouting permissions
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_COMMENTS,

    PERMISSIONS.CREATE_MATCH_SCOUTING,
    PERMISSIONS.EDIT_MATCH_SCOUTING,
    PERMISSIONS.VIEW_MATCH_SCOUTING,

    PERMISSIONS.CREATE_PIT_SCOUTING,
    PERMISSIONS.EDIT_PIT_SCOUTING,
    PERMISSIONS.VIEW_PIT_SCOUTING,

    PERMISSIONS.VIEW_PICKLIST,
  ],
  [ROLES.VIEWER]: [
    // Read-only access to most things
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_COMMENTS,

    PERMISSIONS.VIEW_MATCH_SCOUTING,
    PERMISSIONS.VIEW_PIT_SCOUTING,
    PERMISSIONS.VIEW_PICKLIST,
  ],
  [ROLES.EXTERNAL]: [
    // Very limited access, mainly for external teams
    PERMISSIONS.VIEW_DASHBOARD,
  ],
};

// Helper functions
export function hasPermission(
  userRole: string | null,
  permission: string
): boolean {
  if (
    !userRole ||
    !ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]
  ) {
    return false;
  }
  const rolePermissions =
    ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  return (rolePermissions as string[]).includes(permission);
}

export function hasAnyPermission(
  userRole: string | null,
  permissions: string[]
): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission));
}

export function hasAllPermissions(
  userRole: string | null,
  permissions: string[]
): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission));
}

export function getRolePermissions(role: string): string[] {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
}

export function getAllPermissions(): string[] {
  return Object.values(PERMISSIONS);
}
