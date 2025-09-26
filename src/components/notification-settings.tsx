'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Check, X, AlertTriangle, Smartphone } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';

export function NotificationSettings() {
  const {
    permission,
    isSupported,
    isSubscribed,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
  } = useNotifications();

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handlePermissionRequest = async () => {
    setIsLoading(true);
    const granted = await requestPermission();
    setIsLoading(false);
    
    if (granted) {
      toast({
        title: "Permissions granted",
        description: "You can now receive notifications from TRC Scouting.",
      });
    } else {
      toast({
        title: "Permission denied",
        description: "Notifications have been blocked. You can enable them in your browser settings.",
        variant: "destructive",
      });
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    const subscription = await subscribe();
    setIsLoading(false);
    
    if (subscription) {
      toast({
        title: "Notifications enabled",
        description: "You're now subscribed to push notifications.",
      });
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    const success = await unsubscribe();
    setIsLoading(false);
    
    if (success) {
      toast({
        title: "Notifications disabled",
        description: "You've unsubscribed from push notifications.",
      });
    }
  };

  const handleTestNotification = async () => {
    const success = await showNotification({
      title: 'Test Notification',
      body: 'This is a test notification from TRC Scouting!',
      data: { url: '/dashboard' },
    });

    if (success) {
      toast({
        title: "Test notification sent",
        description: "Check your notification area to see it.",
      });
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { icon: <Check className="h-4 w-4 text-green-500" />, text: 'Granted', color: 'text-green-500' };
      case 'denied':
        return { icon: <X className="h-4 w-4 text-red-500" />, text: 'Denied', color: 'text-red-500' };
      default:
        return { icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />, text: 'Not requested', color: 'text-yellow-500' };
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Notifications are not supported in this browser or device.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const permissionStatus = getPermissionStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure how and when you receive notifications from TRC Scouting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Permission Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="font-medium">Browser Permissions</Label>
                <p className="text-sm text-muted-foreground">
                  Allow TRC Scouting to show notifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {permissionStatus.icon}
              <span className={`text-sm font-medium ${permissionStatus.color}`}>
                {permissionStatus.text}
              </span>
            </div>
          </div>

          {permission !== 'granted' && (
            <Button
              onClick={handlePermissionRequest}
              disabled={isLoading || permission === 'denied'}
              variant={permission === 'denied' ? 'secondary' : 'default'}
              className="w-full"
            >
              {isLoading ? 'Requesting...' : permission === 'denied' ? 'Blocked (Check Browser Settings)' : 'Request Permission'}
            </Button>
          )}
        </div>

        <Separator />

        {/* Push Notification Subscription */}
        {permission === 'granted' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications even when the app is closed
                  </p>
                </div>
              </div>
              <Switch
                checked={isSubscribed}
                onCheckedChange={isSubscribed ? handleUnsubscribe : handleSubscribe}
                disabled={isLoading}
              />
            </div>

            {isSubscribed && (
              <div className="space-y-3">
                <Button
                  onClick={handleTestNotification}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Send Test Notification
                </Button>
                
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    <div>
                      <p>You&apos;re subscribed to push notifications. You&apos;ll receive notifications about:</p>
                      <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                        <li>Match schedule updates</li>
                        <li>Important event announcements</li>
                        <li>Data sync reminders</li>
                        <li>System status updates</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )}

        {/* Notification Types */}
        {permission === 'granted' && isSubscribed && (
          <>
            <Separator />
            <div className="space-y-4">
              <Label className="font-medium">Notification Types</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Match Updates</Label>
                    <p className="text-xs text-muted-foreground">
                      Schedule changes and match results
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Data Sync</Label>
                    <p className="text-xs text-muted-foreground">
                      Database synchronization status
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Event Updates</Label>
                    <p className="text-xs text-muted-foreground">
                      Important event announcements
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">System Status</Label>
                    <p className="text-xs text-muted-foreground">
                      App updates and maintenance notices
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}