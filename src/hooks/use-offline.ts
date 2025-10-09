// React hook for detecting online/offline status and managing sync operations
// Automatically triggers sync when connectivity is restored

import { useState, useEffect, useCallback } from 'react';
import { offlineQueueManager } from '@/lib/offline-queue-manager';
import type { SyncResult, NetworkStatus } from '@/lib/offline-types';

interface UseOfflineReturn {
  isOnline: boolean;
  networkStatus: NetworkStatus;
  pendingCount: number;
  totalQueuedCount: number;
  syncInProgress: boolean;
  lastSyncResult: SyncResult | null;
  // Actions
  triggerSync: () => Promise<SyncResult>;
  retryFailedEntries: () => Promise<SyncResult>;
  clearSyncedEntries: () => Promise<number>;
  // Config
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [totalQueuedCount, setTotalQueuedCount] = useState(0);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Update queue counts
  const updateCounts = useCallback(async () => {
    try {
      const [pending, total] = await Promise.all([
        offlineQueueManager.getPendingCount(),
        offlineQueueManager.getTotalQueuedCount(),
      ]);
      setPendingCount(pending);
      setTotalQueuedCount(total);
    } catch (error) {
      console.error('Failed to update queue counts:', error);
    }
  }, []);

  // Handle sync completion
  const handleSyncResult = useCallback((result: SyncResult) => {
    setLastSyncResult(result);
    setSyncInProgress(false);
    updateCounts(); // Refresh counts after sync
  }, [updateCounts]);

  // Trigger manual sync
  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }

    if (syncInProgress) {
      throw new Error('Sync already in progress');
    }

    setSyncInProgress(true);
    
    try {
      const result = await offlineQueueManager.syncPendingEntries();
      handleSyncResult(result);
      return result;
    } catch (error) {
      setSyncInProgress(false);
      throw error;
    }
  }, [isOnline, syncInProgress, handleSyncResult]);

  // Retry failed entries
  const retryFailedEntries = useCallback(async (): Promise<SyncResult> => {
    if (!isOnline) {
      throw new Error('Cannot retry while offline');
    }

    if (syncInProgress) {
      throw new Error('Sync already in progress');
    }

    setSyncInProgress(true);
    
    try {
      const result = await offlineQueueManager.retryFailedEntries();
      handleSyncResult(result);
      return result;
    } catch (error) {
      setSyncInProgress(false);
      throw error;
    }
  }, [isOnline, syncInProgress, handleSyncResult]);

  // Clear synced entries
  const clearSyncedEntries = useCallback(async (): Promise<number> => {
    const count = await offlineQueueManager.clearSyncedEntries();
    await updateCounts();
    return count;
  }, [updateCounts]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      const now = new Date();
      setIsOnline(true);
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        lastOnline: now,
      }));

      // Auto-sync when coming back online if enabled
      if (autoSyncEnabled && pendingCount > 0) {
        setTimeout(() => {
          triggerSync().catch(error => {
            console.error('Auto-sync failed after coming online:', error);
          });
        }, 1000); // Small delay to ensure connection is stable
      }
    };

    const handleOffline = () => {
      const now = new Date();
      setIsOnline(false);
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        lastOffline: now,
      }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [autoSyncEnabled, pendingCount, triggerSync]);

  // Set up sync listener
  useEffect(() => {
    const syncListener = (result: SyncResult) => {
      handleSyncResult(result);
    };

    offlineQueueManager.addSyncListener(syncListener);

    return () => {
      offlineQueueManager.removeSyncListener(syncListener);
    };
  }, [handleSyncResult]);

  // Update counts on mount and when online status changes
  useEffect(() => {
    updateCounts();
    
    // Set up periodic count updates
    const interval = setInterval(updateCounts, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [updateCounts]);

  // Load auto-sync setting from queue manager
  useEffect(() => {
    const loadAutoSyncSetting = async () => {
      try {
        const config = await offlineQueueManager.getSyncConfig();
        setAutoSyncEnabled(config.autoSyncEnabled);
      } catch (error) {
        console.error('Failed to load auto-sync setting:', error);
      }
    };

    loadAutoSyncSetting();
  }, []);

  // Update auto-sync setting in queue manager when changed
  const updateAutoSyncEnabled = useCallback(async (enabled: boolean) => {
    try {
      await offlineQueueManager.setSyncConfig({ autoSyncEnabled: enabled });
      setAutoSyncEnabled(enabled);
    } catch (error) {
      console.error('Failed to update auto-sync setting:', error);
    }
  }, []);

  // Check if sync is in progress from queue manager
  useEffect(() => {
    const checkSyncStatus = () => {
      setSyncInProgress(offlineQueueManager.isSyncInProgress());
    };

    checkSyncStatus();
    
    // Check periodically
    const interval = setInterval(checkSyncStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    isOnline,
    networkStatus,
    pendingCount,
    totalQueuedCount,
    syncInProgress,
    lastSyncResult,
    triggerSync,
    retryFailedEntries,
    clearSyncedEntries,
    autoSyncEnabled,
    setAutoSyncEnabled: updateAutoSyncEnabled,
  };
}

// Hook for just the online/offline status (lighter weight)
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return isOnline;
}