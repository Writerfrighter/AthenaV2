'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export function DatabaseResetComponent() {
  const [isResetting, setIsResetting] = useState(false);
  const [resetProgress, setResetProgress] = useState(0);

  const handleResetDatabase = async () => {
    setIsResetting(true);
    setResetProgress(0);

    // Simulate progress for the reset operation
    const progressInterval = setInterval(() => {
      setResetProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const response = await fetch('/api/database/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset database');
      }

      setResetProgress(100);
      toast.success('Database reset successfully', {
        description: 'All scouting data has been permanently deleted.'
      });
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Failed to reset database', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTimeout(() => {
        setIsResetting(false);
        setResetProgress(0);
      }, 1000);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">Reset Database</h4>
          {isResetting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Resetting database... ({Math.round(resetProgress)}%)
              </div>
              <Progress value={resetProgress} className="h-2" />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Permanently delete all scouting data including pit entries, match entries, and user data.
            This action cannot be undone.
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isResetting}
              className="w-full"
            >
              {isResetting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {isResetting ? 'Resetting...' : 'Reset Database'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all scouting data
                from the database, including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All pit scouting entries</li>
                  <li>All match scouting entries</li>
                  {/* <li>All user accounts and data</li> */}
                </ul>
                <br />
                Make sure you have backed up any important data before proceeding.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetDatabase}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, reset database
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
