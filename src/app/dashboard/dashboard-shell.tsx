"use client";

import { AppSidebar } from "@/components/navigation/app-sidebar";
import { createContext, useContext, useState } from "react";
import dynamic from "next/dynamic";
import { ModeToggle } from "@/components/ui/light-dark-toggle";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { useSession } from "next-auth/react";

const AccountSettingsDialog = dynamic(
  () => import("./account-settings").then((mod) => mod.AccountSettingsDialog),
  { ssr: false },
);

const NotificationSettingsDialog = dynamic(
  () =>
    import("./notification-settings-dialog").then(
      (mod) => mod.NotificationSettingsDialog,
    ),
  { ssr: false },
);

const AccountSettingsContext = createContext<
  { openAccountSettings: () => void } | undefined
>(undefined);

export function useAccountSettingsDialog() {
  const ctx = useContext(AccountSettingsContext);
  if (!ctx)
    throw new Error(
      "useAccountSettingsDialog must be used within AccountSettingsContext",
    );
  return ctx;
}

const NotificationSettingsContext = createContext<
  { openNotificationSettings: () => void } | undefined
>(undefined);

export function useNotificationSettingsDialog() {
  const ctx = useContext(NotificationSettingsContext);
  if (!ctx)
    throw new Error(
      "useNotificationSettingsDialog must be used within NotificationSettingsContext",
    );
  return ctx;
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const openAccountSettings = () => setAccountOpen(true);
  const openNotificationSettings = () => setNotificationOpen(true);
  if (status === "loading") return <p className="p-8">Loading event access…</p>;
  if (status !== "authenticated") return <div className="p-8"><p>Your session has ended. Open a new guest link or sign in.</p><a href="/login">Sign in</a></div>;

  return (
    <AccountSettingsContext.Provider value={{ openAccountSettings }}>
      <NotificationSettingsContext.Provider
        value={{ openNotificationSettings }}
      >
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              {session?.guestEvent && <span className="text-xs text-muted-foreground">Read-only guest · {session.guestEvent.name}</span>}
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <div className="ml-auto flex items-center gap-2">
                <ModeToggle />
                <ThemeSelector />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
          </SidebarInset>
          {accountOpen && (
            <AccountSettingsDialog
              open={accountOpen}
              onOpenChange={setAccountOpen}
            />
          )}
          {notificationOpen && (
            <NotificationSettingsDialog
              open={notificationOpen}
              onOpenChange={setNotificationOpen}
            />
          )}
        </SidebarProvider>
      </NotificationSettingsContext.Provider>
    </AccountSettingsContext.Provider>
  );
}
