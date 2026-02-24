'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertCircle, Database, Download, Filter, ChevronDown, WifiOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { PitScoutingTable } from "@/components/tables/pit-scouting-table";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { PitEntry } from "@/lib/shared-types";
import { useGameConfig } from "@/hooks/use-game-config";
import { useEventConfig } from "@/hooks/use-event-config";
import { indexedDBService } from "@/lib/indexeddb-service";

export default function PitScoutingPage() {
  const [pitEntries, setPitEntries] = useState<PitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);

  const { getCurrentYearConfig, currentYear, competitionType } = useGameConfig();
  const gameConfig = getCurrentYearConfig();
  const { selectedEvent } = useEventConfig();

  const handleExport = async (format: 'json' | 'csv' | 'xlsx' = 'csv') => {
    try {
      const params = new URLSearchParams();
      params.append('year', currentYear.toString());
      params.append('format', format);
      params.append('types', 'pit'); // Only export pit data
      if (selectedEvent?.code) {
        params.append('eventCode', selectedEvent.code);
      }
      params.append('competitionType', competitionType);
      
      const response = await fetch(`/api/database/export?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `pit-scouting-${currentYear}${selectedEvent ? `-${selectedEvent.code}` : ''}.${format}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Data exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Error exporting data:', err);
      toast.error('Failed to export data');
    }
  };

  // Fetch pit entries — try API first, fall back to IndexedDB cache
  const fetchPitEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsOfflineData(false);

      const eventCode = selectedEvent?.code;
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      // If offline, go straight to IndexedDB
      if (!isOnline && eventCode) {
        const cached = await indexedDBService.getCachedPitEntries(eventCode);
        if (cached && cached.entries.length > 0) {
          setPitEntries(cached.entries);
          setIsOfflineData(true);
          return;
        }
        setError('Offline — no cached pit scouting data available. Use the pre-cache feature in Settings while online.');
        return;
      }

      const params = new URLSearchParams();
      if (eventCode) params.append('eventCode', eventCode);
      params.append('competitionType', competitionType);
      
      const url = `/api/database/pit?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch pit entries: ${response.statusText}`);
      }

      const data = await response.json();
      setPitEntries(data);
    } catch (err) {
      console.error('Error fetching pit entries:', err);

      // Fallback to IndexedDB cache on network error
      const eventCode = selectedEvent?.code;
      if (eventCode) {
        try {
          const cached = await indexedDBService.getCachedPitEntries(eventCode);
          if (cached && cached.entries.length > 0) {
            setPitEntries(cached.entries);
            setIsOfflineData(true);
            toast.info('Showing cached pit scouting data (offline)');
            return;
          }
        } catch (cacheErr) {
          console.warn('Failed to read cached pit entries:', cacheErr);
        }
      }

      setError('Failed to load pit scouting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPitEntries();
  }, [selectedEvent, competitionType]);

  // Handle edit - navigate to scout form with edit ID
  const handleEdit = (entry: PitEntry) => {
    window.location.href = `/scout/pitscout?editId=${entry.id}`;
  };

  // Handle delete
  const handleDelete = (id: number) => {
    setEntryToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!entryToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/database/pit?id=${entryToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete pit entry');
      }

      // Refresh data
      await fetchPitEntries();
      toast.success('Pit entry deleted successfully');
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    } catch (err) {
      console.error('Error deleting pit entry:', err);
      toast.error('Failed to delete pit entry');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pit Scouting</h1>
            <p className="text-muted-foreground">
              View and manage pit scouting data for teams
            </p>
          </div>
          {isOfflineData && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              Cached Data
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => window.open('/scout/pitscout', '_blank')}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Entry
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pitEntries.length}</div>
            <p className="text-xs text-muted-foreground">
              Pit scouting records
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Unique Teams</CardTitle>
            <Badge variant="secondary" className="h-4 w-4 p-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(pitEntries.map(entry => entry.teamNumber)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Teams scouted
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Game Year</CardTitle>
            <Badge variant="outline">{currentYear}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameConfig?.gameName || 'REEFSCAPE'}</div>
            <p className="text-xs text-muted-foreground">
              Current season
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pit Scouting Data</CardTitle>
          <CardDescription>
            View and manage all pit scouting entries. Click the actions menu to edit or delete entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <PitScoutingTable
              data={pitEntries}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Pit Entry"
        description="Are you sure you want to delete this pit scouting entry? This action cannot be undone."
        loading={deleteLoading}
      />
    </div>
  );
}