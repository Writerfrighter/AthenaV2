'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSelectedEvent } from '@/hooks/use-event-config';
import { useGameConfig } from '@/hooks/use-game-config';
import {
  Download,
  CheckCircle,
  AlertCircle,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface PrecacheRoute {
  label: string;
  url: string;
  /** 'page' routes are fetched as navigations; 'api' routes as regular fetches */
  type: 'page' | 'api';
}

type RouteStatus = 'pending' | 'loading' | 'success' | 'error';

interface PrecacheResult {
  route: PrecacheRoute;
  status: RouteStatus;
  error?: string;
}

export function OfflinePrecache({ className }: { className?: string }) {
  const selectedEvent = useSelectedEvent();
  const { competitionType, currentYear } = useGameConfig();

  const [isCaching, setIsCaching] = useState(false);
  const [results, setResults] = useState<PrecacheResult[]>([]);
  const [progress, setProgress] = useState(0);

  const buildRoutes = useCallback((): PrecacheRoute[] => {
    const routes: PrecacheRoute[] = [
      // Auth session — must be cached so offline relaunches stay logged in
      { label: 'Auth Session', url: '/api/auth/session', type: 'api' },
      // Pages that should be cached for offline
      { label: 'Dashboard', url: '/dashboard', type: 'page' },
      { label: 'Match Scout', url: '/scout/matchscout', type: 'page' },
      { label: 'Pit Scout', url: '/scout/pitscout', type: 'page' },
      { label: 'Login', url: '/login', type: 'page' },
    ];

    // API routes that depend on the selected event
    if (selectedEvent?.code) {
      routes.push(
        {
          label: `Event Teams (${selectedEvent.code})`,
          url: `/api/events/${selectedEvent.code}/teams?competitionType=${competitionType}&year=${currentYear}`,
          type: 'api',
        },
        {
          label: `Match Schedule (${selectedEvent.code})`,
          url: `/api/event/schedule?eventCode=${selectedEvent.code}&competitionType=${competitionType}&season=${currentYear}`,
          type: 'api',
        },
        {
          label: `Scouting Schedule (${selectedEvent.code})`,
          url: `/api/schedule/blocks?eventCode=${selectedEvent.code}&year=${currentYear}&competitionType=${competitionType}`,
          type: 'api',
        },
      );
    }

    return routes;
  }, [selectedEvent, competitionType, currentYear]);

  const handlePrecache = async () => {
    if (!navigator.onLine) {
      toast.error('You must be online to precache routes');
      return;
    }

    const routes = buildRoutes();
    setIsCaching(true);
    setProgress(0);
    setResults(routes.map(route => ({ route, status: 'pending' })));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];

      // Mark current route as loading
      setResults(prev =>
        prev.map((r, idx) => (idx === i ? { ...r, status: 'loading' } : r))
      );

      try {
        // Fetch the route so the service worker's runtime cache picks it up
        const response = await fetch(route.url, {
          cache: 'no-cache', // Force a fresh network request so the SW caches the latest
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Consume the body so the response fully completes
        await response.text();

        setResults(prev =>
          prev.map((r, idx) => (idx === i ? { ...r, status: 'success' } : r))
        );
        successCount++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setResults(prev =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: 'error', error: errorMsg } : r
          )
        );
        errorCount++;
      }

      setProgress(Math.round(((i + 1) / routes.length) * 100));
    }

    setIsCaching(false);

    if (errorCount === 0) {
      toast.success('All routes cached for offline use', {
        description: `${successCount} routes cached successfully`,
        icon: <CheckCircle className="h-4 w-4" />,
      });
    } else {
      toast.warning('Some routes failed to cache', {
        description: `${successCount} succeeded, ${errorCount} failed`,
        icon: <AlertCircle className="h-4 w-4" />,
      });
    }
  };

  const routes = buildRoutes();
  const hasEvent = !!selectedEvent?.code;
  const completedCount = results.filter(r => r.status === 'success').length;
  const erroredCount = results.filter(r => r.status === 'error').length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Offline Precache
        </CardTitle>
        <CardDescription>
          Pre-download pages and data so the app works offline at competitions.
          Select an event first for event-specific data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event status */}
        <div className="flex items-center gap-2 text-sm">
          {hasEvent ? (
            <>
              <Badge variant="outline" className="text-primary border-primary">
                {selectedEvent?.name}
              </Badge>
              <span className="text-muted-foreground">
                ({routes.length} routes to cache)
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              No event selected — only core pages will be cached ({routes.length} routes)
            </span>
          )}
        </div>

        {/* Progress bar */}
        {(isCaching || results.length > 0) && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{isCaching ? 'Caching...' : 'Complete'}</span>
              <span>
                {completedCount} / {routes.length} done
                {erroredCount > 0 && ` (${erroredCount} failed)`}
              </span>
            </div>
          </div>
        )}

        {/* Route list */}
        {results.length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {results.map((result, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-1 px-2 rounded-md bg-muted/40"
              >
                <span className="truncate mr-2">{result.route.label}</span>
                {result.status === 'pending' && (
                  <span className="text-muted-foreground text-xs">Pending</span>
                )}
                {result.status === 'loading' && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                )}
                {result.status === 'success' && (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                )}
                {result.status === 'error' && (
                  <span className="flex items-center gap-1 text-destructive text-xs">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {result.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action button */}
        <Button
          onClick={handlePrecache}
          disabled={isCaching || !navigator.onLine}
          className="w-full"
        >
          {isCaching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Caching Routes...
            </>
          ) : !navigator.onLine ? (
            <>
              <WifiOff className="mr-2 h-4 w-4" />
              Offline — Cannot Precache
            </>
          ) : results.length > 0 && erroredCount === 0 && completedCount === routes.length ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              All Cached — Re-cache
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Cache for Offline Use
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
