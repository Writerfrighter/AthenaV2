"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Database,
  ListOrdered,
  ChartColumnIncreasing,
  Table,
  Home,
  Settings,
  CalendarClock,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { EventSwitcher } from "@/components/event-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SearchForm } from "./search-form";
import { useSession } from "next-auth/react";
import { useGameConfig } from "@/hooks/use-game-config";


const data = {
  user: {
    name: "Noah Fang",
    username: "writerfrighter",
    avatar: "/TRCLogo.webp",
  },
  navMain: [
    { title: "Home", url: "/", icon: Home },
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    {
      title: "Analysis",
      url: "/dashboard/analysis",
      icon: ChartColumnIncreasing,
    },
    {
      title: "Data",
      icon: Database,
      items: [
        {
          title: "Pit Scouting",
          url: "/dashboard/pitscouting",
        },
        {
          title: "Match Scouting",
          url: "/dashboard/matchscouting",
        },
      ],
    },
    {
      title: "Team List",
      url: "/dashboard/teamlist",
      icon: Table,
    },
    {
      title: "Picklist",
      url: "/dashboard/picklist",
      icon: ListOrdered,
    },
    {
      title: "Schedule",
      url: "/dashboard/schedule",
      icon: CalendarClock
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
    // },
  ],
  // projects: [
  //   {
  //     name: "Design Engineering",
  //     url: "#",
  //     icon: Frame,
  //   },
  //   {
  //     name: "Sales & Marketing",
  //     url: "#",
  //     icon: PieChart,
  //   },
  //   {
  //     name: "Travel",
  //     url: "#",
  //     icon: Map,
  //   },
  // ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const { competitionType } = useGameConfig();

  // Use session data if available, otherwise fallback to default
  const userData = session?.user ? {
    name: session.user.name || "User",
    username: session.user.username || "user",
    avatar: "/TRCLogo.webp", // You can update this to use session.user.image if available
  } : {
    name: "Guest",
    username: "guest",
    avatar: "/TRCLogo.webp",
  };

  const competitionName = competitionType === "FRC" 
    ? "FIRST Robotics Competition" 
    : "FIRST Tech Challenge";

  return (
    <Sidebar collapsible="icon" {...props} variant="floating">
      <SidebarHeader className={`${competitionType === "FRC" ? 'bg-blue-200 dark:bg-blue-900' : 'bg-orange-200 dark:bg-orange-900'} rounded-t-sm mb-1.5`}>
        <div className={`px-2 group-data-[collapsible=icon]:hidden`}>
          <p className="text-xs font-medium text-center uppercase tracking-wider" >
            {competitionName}
          </p>
        </div>
        
      </SidebarHeader>
      <SidebarContent>
        <EventSwitcher/>
        <SearchForm className="ml-2"/>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
