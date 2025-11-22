'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertCircle, Database, Download, Filter } from "lucide-react";
import { toast } from "sonner";
import { PitScoutingTable } from "@/components/pit-scouting-table";
import { EditPitEntryDialog } from "@/components/edit-pit-entry-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { PitEntry } from "@/lib/shared-types";
import { useGameConfig } from "@/hooks/use-game-config";
import { useEventConfig } from "@/hooks/use-event-config";

export default function PitScoutingPage() {
  const [pitEntries, setPitEntries] = useState<PitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<PitEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { getCurrentYearConfig, currentYear, competitionType } = useGameConfig();
  const gameConfig = getCurrentYearConfig();
  const { selectedEvent } = useEventConfig();
  const handleExport = async () => {
    try {
      const eventCode = selectedEvent?.code;
      const params = new URLSearchParams();
      if (eventCode) params.append('eventCode', eventCode);
      params.append('competitionType', competitionType);
      
      const url = `/api/database/pit?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch data for export');
      }

      const data = await response.json();

      // Convert to CSV
      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `pit-scouting-${currentYear}${selectedEvent ? `-${selectedEvent.code}` : ''}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success('Data exported successfully');
    } catch (err) {
      console.error('Error exporting data:', err);
      toast.error('Failed to export data');
    }
  };

  // Convert data to CSV
  const convertToCSV = (data: PitEntry[]) => {
    if (data.length === 0) return '';

    const headers = [
      'Team Number',
      'Drive Train',
      'Weight (lbs)',
      'Length (in)',
      'Width (in)',
      'Coral Capability',
      'Algae Capability',
      'Climb Capability',
      'Cycle Time',
      'Reliability'
    ];

    const rows = data.map(entry => [
      entry.teamNumber,
      entry.driveTrain,
      entry.weight,
      entry.length,
      entry.width,
      entry.gameSpecificData?.coralCapability || '',
      entry.gameSpecificData?.algaeCapability || '',
      entry.gameSpecificData?.climbCapability || '',
      entry.gameSpecificData?.cycleTime || '',
      entry.gameSpecificData?.reliability || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  };

  // Fetch pit entries
  const fetchPitEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const eventCode = selectedEvent?.code;
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
      setError('Failed to load pit scouting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPitEntries();
  }, [selectedEvent, competitionType]);

  // Handle edit
  const handleEdit = (entry: PitEntry) => {
    setEditingEntry(entry);
    setEditDialogOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async (updatedEntry: PitEntry) => {
    try {
      const response = await fetch('/api/database/pit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: updatedEntry.id,
          ...updatedEntry,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pit entry');
      }

      // Refresh data
      await fetchPitEntries();
      toast.success('Pit entry updated successfully');
    } catch (err) {
      console.error('Error updating pit entry:', err);
      toast.error('Failed to update pit entry');
      throw err;
    }
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pit Scouting</h1>
          <p className="text-muted-foreground">
            View and manage pit scouting data for teams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => window.open('/scout/pitscout', '_blank')}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Entry
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
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

        <Card>
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

        <Card>
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

      {/* Edit Dialog */}
      <EditPitEntryDialog
        entry={editingEntry}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
      />

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