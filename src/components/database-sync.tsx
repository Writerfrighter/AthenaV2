'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Cloud, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { databaseManager } from '@/db/database-manager';
import { DatabaseProvider } from '@/db/database-service';

export function DatabaseSyncComponent() {
  const [provider, setProvider] = useState<DatabaseProvider>('local');
  const [firebaseConfig, setFirebaseConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [cosmosConfig, setCosmosConfig] = useState({
    endpoint: '',
    databaseName: 'ScoutingDatabase',
    useKeyVault: false,
    keyVaultUrl: ''
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simple toast function
  const toast = (message: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
    if (message.variant === 'destructive') {
      alert(`Error: ${message.title}\n${message.description || ''}`);
    } else {
      alert(`Success: ${message.title}\n${message.description || ''}`);
    }
  };

  const handleProviderChange = (newProvider: DatabaseProvider) => {
    setProvider(newProvider);
    setIsConnected(false);
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      switch (provider) {
        case 'firebase':
          databaseManager.configure({
            provider: 'firebase',
            firebase: firebaseConfig
          });
          break;
        case 'cosmos':
          databaseManager.configure({
            provider: 'cosmos',
            cosmos: cosmosConfig
          });
          break;
        case 'local':
          databaseManager.configure({
            provider: 'local',
            local: { name: 'ScoutingDatabase' }
          });
          break;
        default:
          throw new Error(`Provider ${provider} not implemented yet`);
      }
      
      setIsConnected(true);
      toast({
        title: "Connected",
        description: `Successfully connected to ${provider} database`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (year?: number) => {
    setIsLoading(true);
    try {
      const data = await databaseManager.exportData(year);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scouting-data-${year || 'all'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Exported ${data.matchEntries.length} match entries and ${data.pitEntries.length} pit entries`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.pitEntries || !data.matchEntries) {
        throw new Error('Invalid data format');
      }
      
      await databaseManager.importData(data);
      
      toast({
        title: "Import Successful",
        description: `Imported ${data.matchEntries.length} match entries and ${data.pitEntries.length} pit entries`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="provider">Database Provider</Label>
              <Select value={provider} onValueChange={handleProviderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select database provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local (IndexedDB)</SelectItem>
                  <SelectItem value="firebase">Firebase Firestore</SelectItem>
                  <SelectItem value="cosmos">Azure Cosmos DB</SelectItem>
                  <SelectItem value="supabase" disabled>Supabase (Coming Soon)</SelectItem>
                  <SelectItem value="mongodb" disabled>MongoDB (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Disconnected
                  </>
                )}
              </Badge>
            </div>
          </div>

          {provider === 'firebase' && (
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-medium">Firebase Configuration</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={firebaseConfig.apiKey}
                    onChange={(e) => setFirebaseConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Your Firebase API key"
                  />
                </div>
                <div>
                  <Label htmlFor="authDomain">Auth Domain</Label>
                  <Input
                    id="authDomain"
                    value={firebaseConfig.authDomain}
                    onChange={(e) => setFirebaseConfig(prev => ({ ...prev, authDomain: e.target.value }))}
                    placeholder="your-project.firebaseapp.com"
                  />
                </div>
                <div>
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input
                    id="projectId"
                    value={firebaseConfig.projectId}
                    onChange={(e) => setFirebaseConfig(prev => ({ ...prev, projectId: e.target.value }))}
                    placeholder="your-project-id"
                  />
                </div>
                <div>
                  <Label htmlFor="storageBucket">Storage Bucket</Label>
                  <Input
                    id="storageBucket"
                    value={firebaseConfig.storageBucket}
                    onChange={(e) => setFirebaseConfig(prev => ({ ...prev, storageBucket: e.target.value }))}
                    placeholder="your-project.appspot.com"
                  />
                </div>
              </div>
            </div>
          )}

          {provider === 'cosmos' && (
            <div className="space-y-3 p-4 border rounded-lg">
              <h4 className="font-medium">Azure Cosmos DB Configuration</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cosmosEndpoint">Cosmos DB Endpoint</Label>
                  <Input
                    id="cosmosEndpoint"
                    value={cosmosConfig.endpoint}
                    onChange={(e) => setCosmosConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="https://your-account.documents.azure.com:443/"
                  />
                </div>
                <div>
                  <Label htmlFor="cosmosDatabaseName">Database Name</Label>
                  <Input
                    id="cosmosDatabaseName"
                    value={cosmosConfig.databaseName}
                    onChange={(e) => setCosmosConfig(prev => ({ ...prev, databaseName: e.target.value }))}
                    placeholder="ScoutingDatabase"
                  />
                </div>
                <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                  <strong>Azure Authentication:</strong> This uses managed identity authentication. 
                  Ensure you&apos;re signed into Azure CLI or deployed to Azure with proper permissions.
                  No connection string or keys required!
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleConnect} disabled={isLoading} className="w-full">
            {isLoading ? "Connecting..." : "Connect to Database"}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Scouting Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export your scouting data to a JSON file for backup or sharing with other devices.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleExport()} disabled={isLoading} variant="outline">
                  Export All Data
                </Button>
                <Button onClick={() => handleExport(2025)} disabled={isLoading} variant="outline">
                  Export 2025 Only
                </Button>
                <Button onClick={() => handleExport(2024)} disabled={isLoading} variant="outline">
                  Export 2024 Only
                </Button>
                <Button onClick={() => handleExport(2023)} disabled={isLoading} variant="outline">
                  Export 2023 Only
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Scouting Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Import scouting data from a JSON file. This will replace existing data for the years being imported.
              </p>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <Label htmlFor="import-file" className="cursor-pointer">
                  <span className="text-sm font-medium">Click to select a file</span>
                  <br />
                  <span className="text-xs text-muted-foreground">JSON files only</span>
                </Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {provider !== 'local' && isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Cloud Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sync your data with the cloud database. This feature is coming soon.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button disabled variant="outline">
                Upload to Cloud
              </Button>
              <Button disabled variant="outline">
                Download from Cloud
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
