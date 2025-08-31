"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { createContext, useContext, useState } from "react";
import { AccountSettingsDialog } from "./account-settings";
import { ModeToggle } from "@/components/ui/light-dark-toggle";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Context to control account settings dialog
const AccountSettingsContext = createContext<{ openAccountSettings: () => void } | undefined>(undefined);

export function useAccountSettingsDialog() {
  const ctx = useContext(AccountSettingsContext);
  if (!ctx) throw new Error("useAccountSettingsDialog must be used within AccountSettingsContext");
  return ctx;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openAccountSettings = () => setOpen(true);
  return (
    <AccountSettingsContext.Provider value={{ openAccountSettings }}>
      <SidebarProvider>
        <AppSidebar />
        {/* Header/Breakcrumbs */}
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* Main body content */}
            {children}
          </div>
        </SidebarInset>
        <AccountSettingsDialog open={open} onOpenChange={setOpen} />
      </SidebarProvider>
    </AccountSettingsContext.Provider>
  );
}
