"use client";

import { createContext, useContext } from "react";

export const AccountSettingsContext = createContext<
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

export const NotificationSettingsContext = createContext<
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
