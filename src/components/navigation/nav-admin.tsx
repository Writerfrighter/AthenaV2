"use client";

import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinkClass } from "./nav-main";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavAdmin({
  items,
}: {
  items: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup className="py-0">
      <SidebarGroupLabel className="mt-4 h-6 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">Admin</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url || (item.url !== "/dashboard/admin" && pathname.startsWith(item.url + "/"));

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={isActive} className={navLinkClass}>
                <Link
                  href={item.url}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  {item.name}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
