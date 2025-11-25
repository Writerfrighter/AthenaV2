// Simple Offline Status Widget
// Shows basic offline status and sync info for use in headers/toolbars

'use client';

import { useOffline } from '@/hooks/use-offline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  WifiOff, 
  Wifi, 
  Clock, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface OfflineStatusWidgetProps {
  showSyncButton?: boolean;
  className?: string;
}

export function OfflineStatusWidget({ 
  showSyncButton = false, 
  className 
}: OfflineStatusWidgetProps) {
  const {
    isOnline,
    pendingCount,
    syncInProgress,
    triggerSync,
  } = useOffline();

  const handleQuickSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    try {
      await triggerSync();
      toast.success('Sync completed');
    } catch (error) {
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Network Status */}
      {isOnline ? (
        <Badge variant="outline" className="gap-1 text-primary border-primary">
          <Wifi className="h-3 w-3" />
          Online
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1 text-chart-5 border-chart-5">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      )}
      
      {/* Pending Count */}
      {pendingCount > 0 && (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          {pendingCount} queued
        </Badge>
      )}
      
      {/* Sync Status */}
      {syncInProgress && (
        <Badge variant="outline" className="gap-1 text-chart-2 border-chart-2">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Syncing
        </Badge>
      )}
      
      {/* Quick Sync Button */}
      {showSyncButton && pendingCount > 0 && isOnline && !syncInProgress && (
        <Button
          onClick={handleQuickSync}
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Sync
        </Button>
      )}
      
      {/* Error indicator for failed entries */}
      {!syncInProgress && pendingCount > 0 && isOnline && (
        <Button
          onClick={handleQuickSync}
          size="sm"
          variant="ghost"
          className="h-6 px-1 text-orange-600 hover:text-orange-700"
          title="Click to sync pending entries"
        >
          <AlertCircle className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}