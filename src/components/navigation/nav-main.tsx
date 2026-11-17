"use client";

import { type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOnboarding, useTourHighlight } from "@/components/onboarding/onboarding-provider";

// Minimal text nav: active link is bold foreground, the rest muted.
export const navLinkClass =
  "h-8 px-2 text-muted-foreground hover:bg-transparent hover:text-foreground data-[active=true]:bg-transparent data-[active=true]:font-semibold data-[active=true]:text-foreground";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url?: string;
    icon?: LucideIcon;
    items?: {
      title: string;
      isActive?: boolean;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const { completeAction } = useOnboarding();
  const competitionHighlight = useTourHighlight("competition");
  const settingsHighlight = useTourHighlight("settings");
  const { isMobile, setOpenMobile } = useSidebar();
  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };
  const routeIsActive = (url: string) =>
    url === "/dashboard" ? pathname === url : pathname === url || pathname.startsWith(`${url}/`);

  const link = (title: string, url: string, onClick?: () => void, extra?: string) => (
    <SidebarMenuItem key={title}>
      <SidebarMenuButton asChild isActive={routeIsActive(url)} className={`${navLinkClass} ${extra ?? ""}`}>
        <Link href={url} onClick={() => { onClick?.(); closeMobileSidebar(); }}>
          {title}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <>
      {items.map((item) => {
        if (!item.items?.length) {
          const isSettings = item.title === "Settings";
          return (
            <SidebarGroup key={item.title} className="py-0" data-tour-target={isSettings ? "settings" : undefined}>
              <SidebarMenu>
                {link(item.title, item.url!, isSettings ? () => completeAction("settings") : undefined, isSettings ? settingsHighlight : undefined)}
              </SidebarMenu>
            </SidebarGroup>
          );
        }
        const isCompetition = item.title === "Competition";
        return (
          <SidebarGroup
            key={item.title}
            className={`py-0 ${isCompetition ? competitionHighlight : ""}`}
            data-tour-target={isCompetition ? "competition" : undefined}
          >
            <SidebarGroupLabel className="h-7 pt-3 text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
              {item.title}
            </SidebarGroupLabel>
            <SidebarMenu>
              {item.items.map((sub) => link(sub.title, sub.url, isCompetition ? () => completeAction("competition") : undefined))}
            </SidebarMenu>
          </SidebarGroup>
        );
      })}
    </>
  );
}
