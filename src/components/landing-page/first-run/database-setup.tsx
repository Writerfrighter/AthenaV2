"use client";

import { Database, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DatabaseFormState, DatabaseProvider } from "@/lib/types/db/providers";

interface DatabaseStepProps {
  value: DatabaseFormState;
  onChange: (value: DatabaseFormState) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const PROVIDERS: { value: DatabaseProvider; label: string }[] = [
  { value: "azuresql", label: "Azure SQL" },
  { value: "firebase", label: "Firebase" },
  { value: "cosmos", label: "Cosmos DB" },
  { value: "mariadb", label: "MariaDB" },
];

function isDatabaseFormValid(form: DatabaseFormState): boolean {
  switch (form.provider) {
    case "azuresql":
      return (
        form.azuresql.connectionString.trim().length > 0 ||
        (form.azuresql.server.trim().length > 0 && form.azuresql.database.trim().length > 0)
      );
    case "firebase":
      return (
        form.firebase.databaseURL.trim().length > 0 &&
        (form.firebase.serviceAccountPath.trim().length > 0 ||
          form.firebase.serviceAccountJson.trim().length > 0)
      );
    case "cosmos":
      return (
        form.cosmos.endpoint.trim().length > 0 &&
        form.cosmos.key.trim().length > 0 &&
        form.cosmos.databaseId.trim().length > 0 &&
        form.cosmos.containerId.trim().length > 0
      );
    case "mariadb":
      return (
        form.mariadb.connectionString.trim().length > 0 ||
        (form.mariadb.host.trim().length > 0 &&
          form.mariadb.database.trim().length > 0 &&
          form.mariadb.user.trim().length > 0)
      );
    default:
      return false;
  }
}

export function DatabaseStep({ value, onChange, onSubmit, isSubmitting, error }: DatabaseStepProps) {
  const canSubmit = isDatabaseFormValid(value) && !isSubmitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Database className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle className="text-2xl">Connect your database</CardTitle>
          <CardDescription className="mt-2">
            Choose a provider and enter its connection details. We&apos;ll
            verify the connection before moving on.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Database provider</Label>
            <Select
              value={value.provider}
              onValueChange={(provider) => onChange({ ...value, provider: provider as DatabaseProvider })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {value.provider === "azuresql" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Connection string</Label>
                <Textarea
                  value={value.azuresql.connectionString}
                  onChange={(e) =>
                    onChange({ ...value, azuresql: { ...value.azuresql, connectionString: e.target.value } })
                  }
                  placeholder="Optional: paste a full Azure SQL connection string"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Server</Label>
                  <Input
                    value={value.azuresql.server}
                    onChange={(e) => onChange({ ...value, azuresql: { ...value.azuresql, server: e.target.value } })}
                    placeholder="your-server.database.windows.net"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Database</Label>
                  <Input
                    value={value.azuresql.database}
                    onChange={(e) =>
                      onChange({ ...value, azuresql: { ...value.azuresql, database: e.target.value } })
                    }
                    placeholder="ScoutingDatabase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>User</Label>
                  <Input
                    value={value.azuresql.user}
                    onChange={(e) => onChange({ ...value, azuresql: { ...value.azuresql, user: e.target.value } })}
                    placeholder="Optional if using managed identity"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={value.azuresql.password}
                    onChange={(e) =>
                      onChange({ ...value, azuresql: { ...value.azuresql, password: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Managed identity</Label>
                  <Select
                    value={value.azuresql.useManagedIdentity ? "yes" : "no"}
                    onValueChange={(v) =>
                      onChange({ ...value, azuresql: { ...value.azuresql, useManagedIdentity: v === "yes" } })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Enabled</SelectItem>
                      <SelectItem value="no">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {value.provider === "firebase" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Service account path</Label>
                <Input
                  value={value.firebase.serviceAccountPath}
                  onChange={(e) =>
                    onChange({ ...value, firebase: { ...value.firebase, serviceAccountPath: e.target.value } })
                  }
                  placeholder="/path/to/service-account.json"
                />
              </div>
              <div className="space-y-2">
                <Label>Database URL</Label>
                <Input
                  value={value.firebase.databaseURL}
                  onChange={(e) =>
                    onChange({ ...value, firebase: { ...value.firebase, databaseURL: e.target.value } })
                  }
                  placeholder="https://your-project.firebaseio.com"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Service account JSON</Label>
                <Textarea
                  value={value.firebase.serviceAccountJson}
                  onChange={(e) =>
                    onChange({ ...value, firebase: { ...value.firebase, serviceAccountJson: e.target.value } })
                  }
                  placeholder="Optional JSON object for inline credentials"
                />
              </div>
            </div>
          )}

          {value.provider === "cosmos" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Endpoint</Label>
                <Input
                  value={value.cosmos.endpoint}
                  onChange={(e) => onChange({ ...value, cosmos: { ...value.cosmos, endpoint: e.target.value } })}
                  placeholder="https://account.documents.azure.com:443/"
                />
              </div>
              <div className="space-y-2">
                <Label>Key</Label>
                <Input
                  type="password"
                  value={value.cosmos.key}
                  onChange={(e) => onChange({ ...value, cosmos: { ...value.cosmos, key: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label>Database ID</Label>
                <Input
                  value={value.cosmos.databaseId}
                  onChange={(e) => onChange({ ...value, cosmos: { ...value.cosmos, databaseId: e.target.value } })}
                  placeholder="database name"
                />
              </div>
              <div className="space-y-2">
                <Label>Container ID</Label>
                <Input
                  value={value.cosmos.containerId}
                  onChange={(e) => onChange({ ...value, cosmos: { ...value.cosmos, containerId: e.target.value } })}
                  placeholder="users"
                />
              </div>
            </div>
          )}

          {value.provider === "mariadb" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Connection string</Label>
                <Textarea
                  value={value.mariadb.connectionString}
                  onChange={(e) =>
                    onChange({ ...value, mariadb: { ...value.mariadb, connectionString: e.target.value } })
                  }
                  placeholder="Optional: full MariaDB connection string"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input
                    value={value.mariadb.host}
                    onChange={(e) => onChange({ ...value, mariadb: { ...value.mariadb, host: e.target.value } })}
                    placeholder="localhost"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input
                    value={value.mariadb.port}
                    onChange={(e) => onChange({ ...value, mariadb: { ...value.mariadb, port: e.target.value } })}
                    placeholder="3306"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Database</Label>
                  <Input
                    value={value.mariadb.database}
                    onChange={(e) => onChange({ ...value, mariadb: { ...value.mariadb, database: e.target.value } })}
                    placeholder="athena"
                  />
                </div>
                <div className="space-y-2">
                  <Label>User</Label>
                  <Input
                    value={value.mariadb.user}
                    onChange={(e) => onChange({ ...value, mariadb: { ...value.mariadb, user: e.target.value } })}
                    placeholder="root"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={value.mariadb.password}
                    onChange={(e) => onChange({ ...value, mariadb: { ...value.mariadb, password: e.target.value } })}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing connection...
              </>
            ) : (
              <>
                Test connection &amp; continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}