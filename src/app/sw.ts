/* eslint-disable @typescript-eslint/no-explicit-any */
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis & {
  registration: ServiceWorkerRegistration;
  clients: any;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Background sync tags
const SYNC_TAGS = {
  OFFLINE_DATA: 'offline-data-sync',
  RETRY_FAILED: 'retry-failed-sync'
} as const;

// Handle background sync events
self.addEventListener('sync', function(event: any) {
  console.log('[Service Worker] Background sync event:', event.tag);
  
  if (event.tag === SYNC_TAGS.OFFLINE_DATA) {
    event.waitUntil(syncOfflineData());
  } else if (event.tag === SYNC_TAGS.RETRY_FAILED) {
    event.waitUntil(retryFailedEntries());
  }
});

// Sync offline data
async function syncOfflineData() {
  console.log('[Service Worker] Syncing offline data...');
  
  try {
    // Import the queue manager in the service worker context
    const { offlineQueueManager } = await import('../lib/offline-queue-manager');
    const result = await offlineQueueManager.syncPendingEntries();
    
    console.log('[Service Worker] Sync completed:', result);
    
    // Notify all clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach((client: any) => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        result
      });
    });
    
    // Show notification if there were sync errors
    if (!result.success && result.errors.length > 0) {
      await self.registration.showNotification('Sync Issues', {
        body: `${result.failedCount} entries failed to sync. Check the app for details.`,
        icon: '/TRCLogo.webp',
        badge: '/TRCLogo.webp',
        tag: 'sync-error',
        requireInteraction: true,
        data: { url: '/dashboard' }
      });
    } else if (result.syncedCount > 0) {
      await self.registration.showNotification('Data Synced', {
        body: `${result.syncedCount} scouting entries synced successfully.`,
        icon: '/TRCLogo.webp',
        badge: '/TRCLogo.webp',
        tag: 'sync-success',
        requireInteraction: false,
        data: { url: '/dashboard' }
      });
    }
    
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    
    // Show error notification
    await self.registration.showNotification('Sync Failed', {
      body: 'Failed to sync offline data. Please try again manually.',
      icon: '/TRCLogo.webp',
      badge: '/TRCLogo.webp',
      tag: 'sync-error',
      requireInteraction: true,
      data: { url: '/dashboard' }
    });
  }
}

// Retry failed entries
async function retryFailedEntries() {
  console.log('[Service Worker] Retrying failed entries...');
  
  try {
    const { offlineQueueManager } = await import('../lib/offline-queue-manager');
    const result = await offlineQueueManager.retryFailedEntries();
    
    console.log('[Service Worker] Retry completed:', result);
    
    // Notify all clients
    const clients = await self.clients.matchAll();
    clients.forEach((client: any) => {
      client.postMessage({
        type: 'RETRY_COMPLETED',
        result
      });
    });
    
  } catch (error) {
    console.error('[Service Worker] Retry failed:', error);
  }
}

// Handle messages from the main app
self.addEventListener('message', async function(event: any) {
  console.log('[Service Worker] Received message:', event.data);
  
  if (event.data?.type === 'REGISTER_SYNC') {
    // Register background sync
    try {
      await self.registration.sync.register(SYNC_TAGS.OFFLINE_DATA);
      console.log('[Service Worker] Background sync registered');
    } catch (error) {
      console.error('[Service Worker] Failed to register background sync:', error);
    }
  } else if (event.data?.type === 'REGISTER_RETRY_SYNC') {
    // Register retry sync
    try {
      await self.registration.sync.register(SYNC_TAGS.RETRY_FAILED);
      console.log('[Service Worker] Retry sync registered');
    } catch (error) {
      console.error('[Service Worker] Failed to register retry sync:', error);
    }
  }
});

// Add notification event listeners
self.addEventListener('push', function(event: any) {
  console.log('[Service Worker] Push Received.');
  
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const title = data.title || 'TRC Scouting';
  const options = {
    body: data.body || 'New notification',
    icon: '/TRCLogo.webp',
    badge: '/TRCLogo.webp',
    data: data.data || {},
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event: any) {
  console.log('[Service Worker] Notification click Received.');
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList: any[]) {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window/tab, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event: any) {
  console.log('[Service Worker] Notification closed.', event);
});
