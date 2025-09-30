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
import { NavProjects } from "@/components/nav-projects";
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

// This is sample data.
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
          url: "/scout/pitscout",
        },
        {
          title: "Match Scouting",
          url: "/scout/matchscout",
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
      url: "/dashboard/schedule-maker",
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

  return (
    <Sidebar collapsible="icon" {...props} variant="floating">
      <SidebarHeader>
        <EventSwitcher />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
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
