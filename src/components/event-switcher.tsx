"use client"

import * as React from "react"
import { CalendarDays, ChevronsUpDown, Plus } from "lucide-react"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useEventConfig } from "@/hooks/use-event-config"

export function EventSwitcher() {
  const { isMobile } = useSidebar()
  const { events, selectedEvent, setSelectedEvent } = useEventConfig()

  if (!selectedEvent) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {/* <Image 
                  src={activeEvent.logo}
                  width= {150}
                  height={150}
                  alt="The Logo of {activeTeam.name}"
                /> */}
                <CalendarDays color="black" size={20} />

              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{selectedEvent.name}</span>
                <span className="truncate text-xs">{selectedEvent.region}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Events
            </DropdownMenuLabel>
            {events.map((event, index) => (
              <DropdownMenuItem
                key={event.name}
                onClick={() => setSelectedEvent(event)}
                className="gap-2 p-2"
              >
                {/* <div className="flex size-6 items-center justify-center rounded-md border">
                  <Image
                    src={ event.logo }
                    width={125}
                    height={125}
                    alt="The Logo of a team"
                  />
                </div> */}
                {event.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add event</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
