'use client';

import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    registration: null,
    error: null,
  });

  useEffect(() => {
    // Only register service worker in production and if supported
    if (
      process.env.NODE_ENV !== 'production' ||
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      setState(prev => ({ ...prev, isSupported: false }));
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    const registerServiceWorker = async () => {
      try {
        // Check the service worker file exists and returns 200 before attempting to register.
        // This prevents registering a stale or missing sw.js that would precache missing files.
        const swResp = await fetch('/sw.js', { method: 'GET', cache: 'no-store' });
        if (!swResp.ok) {
          throw new Error(`/sw.js not available (status=${swResp.status})`);
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        
        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration,
          error: null,
        }));

        console.log('Service Worker registered successfully:', registration);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available
                console.log('New service worker update available');
              }
            });
          }
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          isRegistered: false,
          error: errorMessage,
        }));
        console.error('Service Worker registration failed:', error);
      }
    };

    // Register when the page loads
    if (document.readyState === 'loading') {
      window.addEventListener('load', registerServiceWorker);
    } else {
      registerServiceWorker();
    }

    return () => {
      window.removeEventListener('load', registerServiceWorker);
    };
  }, []);

  return state;
}
