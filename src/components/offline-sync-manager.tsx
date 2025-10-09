// Offline Sync Management Component
// Provides UI controls for managing offline data queue and sync operations

'use client';

import { useState } from 'react';
import { useOffline } from '@/hooks/use-offline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  RefreshCw, 
  Trash2, 
  WifiOff, 
  Wifi, 
  CheckCircle, 
  AlertCircle,
  Download,
  Upload,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { offlineApi } from '@/lib/api/database-client';
import type { QueuedEntry } from '@/lib/offline-types';

interface OfflineSyncManagerProps {
  className?: string;
}

export function OfflineSyncManager({ className }: OfflineSyncManagerProps) {
  const {
    isOnline,
    pendingCount,
    totalQueuedCount,
    syncInProgress,
    lastSyncResult,
    triggerSync,
    retryFailedEntries,
    clearSyncedEntries,
    autoSyncEnabled,
    setAutoSyncEnabled,
  } = useOffline();

  const [isClearing, setIsClearing] = useState(false);
  const [queuedEntries, setQueuedEntries] = useState<QueuedEntry[]>([]);
  const [showQueueDetails, setShowQueueDetails] = useState(false);

  // Load queued entries for display
  const loadQueuedEntries = async () => {
    try {
      const entries = await offlineApi.getAllQueued();
      setQueuedEntries(entries);
      setShowQueueDetails(true);
    } catch (error) {
      toast.error('Failed to load queued entries');
      console.error('Error loading queued entries:', error);
    }
  };

  // Handle manual sync
  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    try {
      await triggerSync();
      toast.success('Sync completed successfully');
    } catch (error) {
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Handle retry failed entries
  const handleRetry = async () => {
    if (!isOnline) {
      toast.error('Cannot retry while offline');
      return;
    }

    try {
      await retryFailedEntries();
      toast.success('Retry completed successfully');
    } catch (error) {
      toast.error('Retry failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Handle clear synced entries
  const handleClearSynced = async () => {
    setIsClearing(true);
    try {
      const count = await clearSyncedEntries();
      toast.success(`Cleared ${count} synced entries`);
      if (showQueueDetails) {
        await loadQueuedEntries(); // Refresh the display
      }
    } catch (error) {
      toast.error('Failed to clear synced entries');
      console.error('Error clearing synced entries:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Handle auto-sync toggle
  const handleAutoSyncToggle = async (enabled: boolean) => {
    try {
      await setAutoSyncEnabled(enabled);
      toast.success(`Auto-sync ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update auto-sync setting');
      console.error('Error updating auto-sync:', error);
    }
  };

  // Get status badge for queue entry
  const getStatusBadge = (entry: QueuedEntry) => {
    switch (entry.status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Pending</Badge>;
      case 'syncing':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Syncing</Badge>;
      case 'synced':
        return <Badge variant="outline" className="text-green-600 border-green-600">Synced</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-600 border-red-600">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Offline Data Management
        </CardTitle>
        <CardDescription>
          Manage offline data synchronization and queue status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Offline</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-sync">Auto-sync</Label>
            <Switch
              id="auto-sync"
              checked={autoSyncEnabled}
              onCheckedChange={handleAutoSyncToggle}
            />
          </div>
        </div>

        <Separator />

        {/* Queue Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{totalQueuedCount}</div>
            <div className="text-sm text-muted-foreground">Total Queued</div>
          </div>
        </div>

        {/* Last Sync Result */}
        {lastSyncResult && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Last Sync</span>
              {lastSyncResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {lastSyncResult.syncedCount} synced, {lastSyncResult.failedCount} failed
            </div>
            <div className="text-xs text-muted-foreground">
              {lastSyncResult.timestamp.toLocaleString()}
            </div>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleSync}
              disabled={!isOnline || syncInProgress || pendingCount === 0}
              className="w-full"
            >
              {syncInProgress ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>

            <Button
              onClick={handleRetry}
              disabled={!isOnline || syncInProgress}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Failed
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={loadQueuedEntries}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              View Queue
            </Button>

            <Button
              onClick={handleClearSynced}
              disabled={isClearing}
              variant="outline"
              className="w-full"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Synced
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Queue Details */}
        {showQueueDetails && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Queued Entries</h4>
                <Button
                  onClick={() => setShowQueueDetails(false)}
                  variant="ghost"
                  size="sm"
                >
                  Hide
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {queuedEntries.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    No queued entries
                  </div>
                ) : (
                  queuedEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {entry.type}
                        </Badge>
                        <span className="text-sm">
                          {entry.type === 'pit' 
                            ? `Team ${entry.data.teamNumber}` 
                            : `Match ${(entry.data as { matchNumber?: number }).matchNumber} - Team ${entry.data.teamNumber}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(entry)}
                        <span className="text-xs text-muted-foreground">
                          {entry.attempts > 0 && `${entry.attempts} attempts`}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}