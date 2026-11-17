"use client";

import { AppSidebar } from "@/components/navigation/app-sidebar";
import { useState } from "react";
import {
  AccountSettingsContext,
  NotificationSettingsContext,
} from "./settings-dialogs-context";
import dynamic from "next/dynamic";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import DashboardLoading from "./loading";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist";
import { usePathname } from "next/navigation";

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

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  // Session revalidation keeps the existing session while status is loading.
  // Only replace the dashboard during the initial session load.
  const isInitialLoading = status === "loading" && !session;
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const openAccountSettings = () => setAccountOpen(true);
  const openNotificationSettings = () => setNotificationOpen(true);
  if (status === "unauthenticated") return <div className="p-8"><p>Your session has ended. Open a new guest link or sign in.</p><a href="/login">Sign in</a></div>;

  return (
    <AccountSettingsContext.Provider value={{ openAccountSettings }}>
      <NotificationSettingsContext.Provider
        value={{ openNotificationSettings }}
      >
        <SidebarProvider style={{ "--sidebar-width": "220px" } as React.CSSProperties}>
          <OnboardingProvider>
          {/* red/blue alliance strip across the top */}
          <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 flex h-[3px]">
            <div className="flex-1 bg-[#E5484D]" />
            <div className="flex-1 bg-[#3B7BF6]" />
          </div>
          {isInitialLoading ? <DashboardSidebarLoading /> : <AppSidebar />}
          <SidebarInset>
            {/* The design has no top bar: the menu button only appears where the sidebar is hidden. */}
            <SidebarTrigger className="fixed top-3 left-3 z-40 bg-background md:hidden" />
            <div className="flex w-full flex-1 flex-col gap-9 px-4 pt-14 pb-16 md:px-12 md:pt-8">
              {!isInitialLoading && pathname === "/dashboard" && <OnboardingChecklist />}
              {isInitialLoading ? <DashboardLoading /> : children}
            </div>
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
          </OnboardingProvider>
        </SidebarProvider>
      </NotificationSettingsContext.Provider>
    </AccountSettingsContext.Provider>
  );
}

function DashboardSidebarLoading() {
  return (
    <Sidebar collapsible="offcanvas" className="pt-[3px]" aria-label="Loading navigation">
      <SidebarHeader>
        <Skeleton className="mx-auto h-4 w-40" />
      </SidebarHeader>
      <SidebarContent className="gap-5 px-3 pt-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-9 w-full" />
        <div className="space-y-4 pt-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      </SidebarContent>
      <SidebarFooter>
        <Skeleton className="h-10 w-full" />
      </SidebarFooter>
    </Sidebar>
  );
}
