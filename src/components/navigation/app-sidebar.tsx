"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Database,
  ChartColumnIncreasing,
  Settings,
  DatabaseIcon,
  Users,
  KeyRound,
  FileJson,
  Bell,
  RadioTower,
  LogOut,
} from "lucide-react";

import { NavMain } from "@/components/navigation/nav-main";
import { NavUser } from "@/components/navigation/nav-user";
import { NavAdmin } from "@/components/navigation/nav-admin";
import { EventSwitcher } from "@/components/events/event-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { SearchForm } from "@/components/forms/search-form";
import { useSession, signOut } from "next-auth/react";
import { useOffline } from "@/hooks/use-offline";
import { ModeToggle } from "@/components/ui/light-dark-toggle";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { PermissionGuard } from "../auth/PermissionGuard";
import { ROLES } from "@/lib/auth/roles";
import { APP_LOGO, APP_NAME } from "@/lib/app-config";
import { isGuestPage } from "@/lib/auth/guest-policy";
import { GuidedTour } from "@/components/onboarding/guided-tour";
import { useTourHighlight } from "@/components/onboarding/onboarding-provider";
const data = {
  navMain: [
    { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
    {
      title: "Competition",
      icon: RadioTower,
      items: [
        {
          title: "Schedule",
          url: "/dashboard/schedule",
        },
        {
          title: "Start Pit Scouting",
          url: "/scout/pitscout",
        },
        {
          title: "Start Match Scouting",
          url: "/scout/matchscout",
        },
        {
          title: "Match Preview",
          url: "/dashboard/matchup",
        },
      ],
    },
    {
      title: "Data",
      icon: Database,
      items: [
        { title: "Teams", url: "/dashboard/teamlist" },
        { title: "Pit Entries", url: "/dashboard/pitscouting" },
        { title: "Match Entries", url: "/dashboard/matchscouting" },
        { title: "Scouter Performance", url: "/dashboard/spr" },
      ],
    },
    {
      title: "Strategy",
      icon: ChartColumnIncreasing,
      items: [
        { title: "Analysis", url: "/dashboard/analysis" },
        { title: "Picklist", url: "/dashboard/picklist" },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
  navAdmin: [
    {
      name: "Guest Links",
      url: "/dashboard/guest-links",
      icon: KeyRound,
    },
    {
      name: "Database",
      url: "/dashboard/admin/database",
      icon: DatabaseIcon,
    },
    {
      name: "Team Management",
      url: "/dashboard/admin/team",
      icon: Users,
    },
    {
      name: "Game Configuration",
      url: "/dashboard/admin/game-config",
      icon: FileJson,
    },
    {
      name: "API Keys",
      url: "/dashboard/admin/keys",
      icon: KeyRound,
    },
    {
      name: "Notifications",
      url: "/dashboard/admin/notifications",
      icon: Bell,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const eventHighlight = useTourHighlight("event");
  const guest = session?.guestEvent;
  const navigation = guest ? data.navMain.filter((item) => !item.url || isGuestPage(item.url)).map((item) => ({ ...item, items: item.items?.filter((child) => isGuestPage(child.url)) })) : data.navMain;

  // Use session data if available, otherwise fallback to default
  const userData = session?.user
    ? {
        name: session.user.name || "User",
        username: session.user.username || "user",
        avatar:
          session.user.image ||
          session.user.avatarUrl ||
          APP_LOGO,
      }
    : {
        name: "Guest",
        username: "guest",
        avatar: APP_LOGO,
      };

  const { isOnline, pendingCount, syncInProgress } = useOffline();

  const eventBlock = guest ? (
    <div className="px-2">
      <p className="truncate font-mono text-xs text-muted-foreground" title={guest.name}>
        {guest.name} · {guest.year}
      </p>
      <p className="text-xs text-muted-foreground">{guest.competitionType} · Guest</p>
    </div>
  ) : (
    <div data-tour-target="event" className={`rounded-lg ${eventHighlight}`}>
      <EventSwitcher />
    </div>
  );

  return (
    <Sidebar collapsible="offcanvas" {...props} className="pt-[3px]">
      <SidebarHeader className="px-5 pt-7 pb-3">
        <span className="text-[17px] font-bold tracking-tight lowercase">
          {APP_NAME}<span className="text-chart-1">.</span>
        </span>
      </SidebarHeader>
      <GuidedTour />
      <SidebarContent className="gap-0 px-3">
        <NavMain items={navigation} />
        <PermissionGuard roles={[ROLES.ADMIN, ROLES.LEAD_SCOUT]}>
          <NavAdmin items={data.navAdmin} />
        </PermissionGuard>
      </SidebarContent>
      <SidebarFooter className="gap-2 px-3 pb-4">
        <SearchForm />
        <div className="mx-2 flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
          <div className="-mx-2">{eventBlock}</div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5" role="status">
              <span className={`size-1.5 shrink-0 rounded-full ${isOnline ? "bg-[#0D9488]" : "bg-destructive"}`} aria-hidden="true" />
              <span className="truncate">
                {syncInProgress
                  ? "Syncing…"
                  : pendingCount > 0
                    ? `${pendingCount} waiting to sync`
                    : isOnline
                      ? "Synced"
                      : "Offline · saving on this device"}
              </span>
            </span>
            <span className="flex shrink-0 [&_button]:size-8 [&_button]:border-0">
              <ModeToggle />
              <ThemeSelector />
            </span>
          </div>
        </div>
        <div>
          <div className="min-w-0">
            {guest ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Leave guest access"
                    aria-label="Leave guest access"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut aria-hidden="true" />
                    <span>Leave guest access</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : (
              <NavUser user={userData} />
            )}
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
