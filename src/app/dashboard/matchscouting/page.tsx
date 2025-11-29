'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertCircle, Database, Trophy, Download } from "lucide-react";
import { toast } from "sonner";
import { MatchScoutingTable } from "@/components/match-scouting-table";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { MatchEntry } from "@/lib/shared-types";
import { useGameConfig } from "@/hooks/use-game-config";
import { useEventConfig } from "@/hooks/use-event-config";

export default function MatchScoutingPage() {
  const [matchEntries, setMatchEntries] = useState<MatchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { currentYear, competitionType } = useGameConfig();
  const { selectedEvent } = useEventConfig();

  // Handle export
  const handleExport = async () => {
    try {
      const eventCode = selectedEvent?.code;
      const params = new URLSearchParams();
      if (eventCode) params.append('eventCode', eventCode);
      params.append('competitionType', competitionType);
      
      const url = `/api/database/match?${params.toString()}`;
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
        link.setAttribute('download', `match-scouting-${currentYear}${selectedEvent ? `-${selectedEvent.code}` : ''}.csv`);
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
  const convertToCSV = (data: MatchEntry[]) => {
    if (data.length === 0) return '';

    const headers = [
      'Match Number',
      'Team Number',
      'Alliance',
      'Timestamp',
      'Auto Points',
      'Teleop Points',
      'Total Points',
      'Notes'
    ];

    const rows = data.map(entry => [
      entry.matchNumber,
      entry.teamNumber,
      entry.alliance,
      entry.timestamp.toISOString(),
      entry.gameSpecificData?.autoPoints || '',
      entry.gameSpecificData?.teleopPoints || '',
      entry.gameSpecificData?.totalPoints || '',
      entry.notes
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  };

  // Fetch match entries
  const fetchMatchEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const eventCode = selectedEvent?.code;
      const params = new URLSearchParams();
      if (eventCode) params.append('eventCode', eventCode);
      params.append('competitionType', competitionType);
      
      const url = `/api/database/match?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch match entries: ${response.statusText}`);
      }

      const data = await response.json();
      setMatchEntries(data);
    } catch (err) {
      console.error('Error fetching match entries:', err);
      setError('Failed to load match scouting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchEntries();
  }, [selectedEvent, competitionType]);

  // Handle edit - navigate to scout form with edit ID
  const handleEdit = (entry: MatchEntry) => {
    window.location.href = `/scout/matchscout?editId=${entry.id}`;
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
      const response = await fetch(`/api/database/match?id=${entryToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete match entry');
      }

      // Refresh data
      await fetchMatchEntries();
      toast.success('Match entry deleted successfully');
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    } catch (err) {
      console.error('Error deleting match entry:', err);
      toast.error('Failed to delete match entry');
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
          <h1 className="text-3xl font-bold tracking-tight">Match Scouting</h1>
          <p className="text-muted-foreground">
            View and manage match scouting data for teams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => window.open('/scout/matchscout', '_blank')}>
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
            <div className="text-2xl font-bold">{matchEntries.length}</div>
            <p className="text-xs text-muted-foreground">
              Match scouting records
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
              {new Set(matchEntries.map(entry => entry.teamNumber)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Teams scouted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Matches Played</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(matchEntries.map(entry => entry.matchNumber)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique matches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Match Scouting Data</CardTitle>
          <CardDescription>
            View and manage all match scouting entries. Click the actions menu to edit or delete entries.
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
            <MatchScoutingTable
              data={matchEntries}
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
        title="Delete Match Entry"
        description="Are you sure you want to delete this match scouting entry? This action cannot be undone."
        loading={deleteLoading}
      />
    </div>
  );
}