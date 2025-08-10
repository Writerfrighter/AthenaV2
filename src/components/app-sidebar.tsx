"use client";

import * as React from "react";
import {
  BookOpen,
  Frame,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Database,
  ListOrdered,
  ChartColumnIncreasing,
  Table,
  Home,
  Settings,
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

// This is sample data.
const data = {
  user: {
    name: "Noah Fang",
    username: "writerfrighter",
    avatar: "/TRCLogo.webp",
  },
  navMain: [
    { title: "Home", url: "/dashboard", icon: Home },
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
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
