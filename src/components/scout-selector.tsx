'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { indexedDBService } from '@/lib/indexeddb-service';

interface ScoutUser {
  id: string;
  name: string;
  username: string;
  role: string;
}

interface ScoutSelectorProps {
  selectedScoutId: string | null;
  onScoutChange: (scoutId: string) => void;
  currentUserId: string;
  currentUserRole: string | null;
}

export function ScoutSelector({ selectedScoutId, onScoutChange, currentUserId, currentUserRole }: ScoutSelectorProps) {
  const [scouts, setScouts] = useState<ScoutUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Only show selector for tablet accounts
  const isTabletAccount = currentUserRole === 'tablet';

  useEffect(() => {
    if (isTabletAccount) {
      fetchScouts();
    } else {
      // For non-tablet accounts, auto-select their own ID
      onScoutChange(currentUserId);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTabletAccount, currentUserId]);

  const fetchScouts = async () => {
    try {
      // Try to get cached scout list first (offline-first approach)
      const cachedData = await indexedDBService.getCachedScoutList();
      
      if (cachedData && cachedData.scouts.length > 0) {
        // Use cached data immediately
        setScouts(cachedData.scouts);
        if (!selectedScoutId && cachedData.scouts.length > 0) {
          onScoutChange(cachedData.scouts[0].id);
        }
        setLoading(false);
      }

      // Try to fetch fresh data from API (update cache if online)
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch scouts');
        }
        const data = await response.json();
        
        // Filter to only show scout, lead_scout, and admin roles (people who can scout)
        const scoutUsers = (data.users || []).filter((user: ScoutUser) => 
          ['scout', 'lead_scout', 'admin'].includes(user.role)
        );
        
        // Cache the fresh data for offline use
        await indexedDBService.cacheScoutList(scoutUsers);
        
        // Update UI with fresh data
        setScouts(scoutUsers);

        // Auto-select first scout if none selected
        if (!selectedScoutId && scoutUsers.length > 0) {
          onScoutChange(scoutUsers[0].id);
        }
      } catch (fetchError) {
        // If we have cached data, we already set it above
        // If we don't have cached data and fetch failed, show error
        if (!cachedData || cachedData.scouts.length === 0) {
          console.error('Error fetching scouts:', fetchError);
          toast.error('Failed to load scout list. Please check your connection.');
        } else {
          // Silently use cached data when offline
          console.log('Using cached scout list (offline)');
        }
      }
    } catch (error) {
      console.error('Error loading scouts:', error);
      toast.error('Failed to load scout list');
    } finally {
      setLoading(false);
    }
  };

  // Don't show the component for non-tablet accounts
  if (!isTabletAccount) {
    return null;
  }

  return (
    <Card className="border rounded-xl shadow-sm bg-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary/90">
          <UserCircle className="h-5 w-5" />
          Scouting For
        </CardTitle>
        <CardDescription>
          Select which scout you're entering data for
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="scout-selector">Scout Name</Label>
          {loading ? (
            <Select disabled>
              <SelectTrigger id="scout-selector">
                <SelectValue placeholder="Loading scouts..." />
              </SelectTrigger>
            </Select>
          ) : scouts.length === 0 ? (
            <Select disabled>
              <SelectTrigger id="scout-selector">
                <SelectValue placeholder="No scouts available" />
              </SelectTrigger>
            </Select>
          ) : (
            <Select value={selectedScoutId || undefined} onValueChange={onScoutChange}>
              <SelectTrigger id="scout-selector" className="text-base font-medium py-6">
                <SelectValue placeholder="Select a scout" />
              </SelectTrigger>
              <SelectContent>
                {scouts.map((scout) => (
                  <SelectItem key={scout.id} value={scout.id} className="text-base">
                    <div className="flex flex-col">
                      <span className="font-medium">{scout.name}</span>
                      <span className="text-xs text-muted-foreground">@{scout.username}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
