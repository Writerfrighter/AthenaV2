'use client';

import { useEffect } from 'react';
import { useServiceWorker } from '@/hooks/use-service-worker';

export function ServiceWorkerManager() {
  const { isSupported, isRegistered, error } = useServiceWorker();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Worker disabled in development mode');
      return;
    }

    if (!isSupported) {
      console.log('Service Worker not supported in this browser');
      return;
    }

    if (isRegistered) {
      console.log('Service Worker registered successfully');
    }

    if (error) {
      console.error('Service Worker error:', error);
    }
  }, [isSupported, isRegistered, error]);

  // This component doesn't render anything visible
  return null;
}
