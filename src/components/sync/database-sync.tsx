'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Cloud } from 'lucide-react';

export function DatabaseSyncComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Azure SQL Database</span>
          <Badge variant="secondary">Active</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          This application is configured to use Azure SQL Database for centralized data storage.
          All team data is automatically synchronized to the shared database.
        </p>
        <div className="text-xs text-muted-foreground">
          Database: {process.env.NEXT_PUBLIC_AZURE_SQL_DATABASE || 'ScoutingDatabase'}<br/>
          Server: {process.env.NEXT_PUBLIC_AZURE_SQL_SERVER || 'your-server.database.windows.net'}
        </div>
      </CardContent>
    </Card>
  );
}
