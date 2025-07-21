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
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
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
  teams: [
    {
      name: "Titan Robotics Club",
      logo: "/TRCLogo.webp",
      number: "492",
    },
    {
      name: "Acme Corp.",
      logo: "/TRCLogo.webp",
      number: "999",
    },
    {
      name: "Evil Corp.",
      logo: "/TRCLogo.webp",
      number: "9999",
    },
  ],
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
      // items: [
      //   {
      //     title: "Introduction",
      //     url: "#",
      //   },
      //   {
      //     title: "Get Started",
      //     url: "#",
      //   },
      //   {
      //     title: "Tutorials",
      //     url: "#",
      //   },
      //   {
      //     title: "Changelog",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "Settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
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
        <TeamSwitcher teams={data.teams} />
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
