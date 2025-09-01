'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, FileSpreadsheet, Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ExportFormat = 'json' | 'csv' | 'xlsx';

export function DataExportImportComponent() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      const params = new URLSearchParams();
      if (selectedYear) {
        params.append('year', selectedYear.toString());
      }
      params.append('format', format);

      const response = await fetch(`/api/database/export?${params}`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      setExportProgress(95);

      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `scouting-data${selectedYear ? `-${selectedYear}` : ''}.${format}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      clearInterval(progressInterval);

      toast.success(`Data exported successfully as ${format.toUpperCase()}`, {
        description: `File: ${filename}`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000,
      });
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 600);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/database/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import data');
      }

      setImportProgress(100);
      clearInterval(progressInterval);

      toast.success('Data imported successfully', {
        description: `File: ${file.name}`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000,
      });
    } finally {
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(0);
        // Reset file input
        event.target.value = '';
      }, 1000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Export/Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="year-select" className="text-sm font-medium">Filter by Year (optional)</label>
          <select
            id="year-select"
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">All Years</option>
            <option value="2023">2023 (CHARGED UP)</option>
            <option value="2024">2024 (CRESCENDO)</option>
            <option value="2025">2025 (REEFSCAPE)</option>
          </select>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Export Data</h4>
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting data... ({Math.round(exportProgress)}%)
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 transition-all duration-200"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              JSON
            </Button>
            <Button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 transition-all duration-200"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              CSV
            </Button>
            <Button
              onClick={() => handleExport('xlsx')}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 transition-all duration-200"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Excel
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Import Data</h4>
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing data... ({Math.round(importProgress)}%)
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json,.csv,.xlsx"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                asChild
                disabled={isImporting}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 cursor-pointer transition-all duration-200"
              >
                <span>
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Choose File
                </span>
              </Button>
            </label>
            <Badge variant="secondary">JSON, CSV, XLSX supported</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Import will replace existing data for the imported years
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
