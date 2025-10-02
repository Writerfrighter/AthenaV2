"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { NotificationSettings } from "@/components/notification-settings"

export function NotificationSettingsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
          <DialogDescription>Configure your notification preferences and permissions.</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <NotificationSettings />
        </div>
      </DialogContent>
    </Dialog>
  );
}