"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Save, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DatabaseProvider = "azuresql" | "firebase" | "cosmos" | "mariadb";

type ProviderSummary = {
  provider: DatabaseProvider;
  azuresql?: {
    server: string;
    database: string;
    user: string;
    useManagedIdentity: boolean;
    hasConnectionString: boolean;
    hasPassword: boolean;
  };
  firebase?: {
    serviceAccountPath: string;
    databaseURL: string;
    hasServiceAccountJson: boolean;
  };
  cosmos?: {
    endpoint: string;
    databaseId: string;
    containerId: string;
    hasKey: boolean;
  };
  mariadb?: {
    connectionString: string;
    host: string;
    port: number | null;
    database: string;
    user: string;
    hasPassword: boolean;
    hasConnectionString: boolean;
  };
};

type DatabaseOptionsResponse = {
  currentProvider: DatabaseProvider;
  providers: DatabaseProvider[];
  config: ProviderSummary;
};

type FormState = {
  provider: DatabaseProvider;
  azuresql: {
    connectionString: string;
    server: string;
    database: string;
    user: string;
    password: string;
    useManagedIdentity: boolean;
  };
  firebase: {
    serviceAccountPath: string;
    serviceAccountJson: string;
    databaseURL: string;
  };
  cosmos: {
    endpoint: string;
    key: string;
    databaseId: string;
    containerId: string;
  };
  mariadb: {
    connectionString: string;
    host: string;
    port: string;
    database: string;
    user: string;
    password: string;
  };
};

const defaultFormState: FormState = {
  provider: "azuresql",
  azuresql: {
    connectionString: "",
    server: "",
    database: "",
    user: "",
    password: "",
    useManagedIdentity: false,
  },
  firebase: {
    serviceAccountPath: "",
    serviceAccountJson: "",
    databaseURL: "",
  },
  cosmos: {
    endpoint: "",
    key: "",
    databaseId: "",
    containerId: "",
  },
  mariadb: {
    connectionString: "",
    host: "",
    port: "",
    database: "",
    user: "",
    password: "",
  },
};

function ProviderCardTitle({
  title,
  active,
}: {
  title: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{title}</span>
      <span className="text-xs text-muted-foreground">
        {active ? "Current" : "Optional"}
      </span>
    </div>
  );
}

export function DatabaseConfigurationComponent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<DatabaseProvider>(
    "azuresql",
  );
  const [providers, setProviders] = useState<DatabaseProvider[]>([]);
  const [form, setForm] = useState<FormState>(defaultFormState);

  useEffect(() => {
    let mounted = true;

    async function loadConfig() {
      try {
        const response = await fetch("/api/scouting/admin/provider-options");
        if (!response.ok) {
          throw new Error("Failed to load database configuration");
        }

        const data = (await response.json()) as DatabaseOptionsResponse;
        if (!mounted) {
          return;
        }

        setCurrentProvider(data.currentProvider);
        setProviders(data.providers);
        setForm({
          provider: data.config.provider,
          azuresql: {
            connectionString: "",
            server: data.config.azuresql?.server ?? "",
            database: data.config.azuresql?.database ?? "",
            user: data.config.azuresql?.user ?? "",
            password: "",
            useManagedIdentity: data.config.azuresql?.useManagedIdentity ?? false,
          },
          firebase: {
            serviceAccountPath: data.config.firebase?.serviceAccountPath ?? "",
            serviceAccountJson: "",
            databaseURL: data.config.firebase?.databaseURL ?? "",
          },
          cosmos: {
            endpoint: data.config.cosmos?.endpoint ?? "",
            key: "",
            databaseId: data.config.cosmos?.databaseId ?? "",
            containerId: data.config.cosmos?.containerId ?? "",
          },
          mariadb: {
            connectionString: "",
            host: data.config.mariadb?.host ?? "",
            port: data.config.mariadb?.port?.toString() ?? "",
            database: data.config.mariadb?.database ?? "",
            user: data.config.mariadb?.user ?? "",
            password: "",
          },
        });
      } catch (fetchError) {
        console.error("Failed to load database configuration:", fetchError);
        if (mounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load database configuration",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadConfig();

    return () => {
      mounted = false;
    };
  }, []);

  const activeSummary = useMemo(() => {
    switch (currentProvider) {
      case "firebase":
        return "Firebase database configuration is active.";
      case "cosmos":
        return "Cosmos DB configuration is active.";
      case "mariadb":
        return "MariaDB configuration is active.";
      default:
        return "Azure SQL configuration is active.";
    }
  }, [currentProvider]);

  const updateProvider = (provider: DatabaseProvider) => {
    setForm((previous) => ({ ...previous, provider }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/scouting/admin/provider-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: form.provider,
          azuresql: {
            connectionString: form.azuresql.connectionString,
            server: form.azuresql.server,
            database: form.azuresql.database,
            user: form.azuresql.user,
            password: form.azuresql.password,
            useManagedIdentity: form.azuresql.useManagedIdentity,
          },
          firebase: {
            serviceAccountPath: form.firebase.serviceAccountPath,
            serviceAccountJson: form.firebase.serviceAccountJson
              ? JSON.parse(form.firebase.serviceAccountJson)
              : undefined,
            databaseURL: form.firebase.databaseURL,
          },
          cosmos: {
            endpoint: form.cosmos.endpoint,
            key: form.cosmos.key,
            databaseId: form.cosmos.databaseId,
            containerId: form.cosmos.containerId,
          },
          mariadb: {
            connectionString: form.mariadb.connectionString,
            host: form.mariadb.host,
            port: form.mariadb.port ? Number(form.mariadb.port) : undefined,
            database: form.mariadb.database,
            user: form.mariadb.user,
            password: form.mariadb.password,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update configuration");
      }

      setCurrentProvider(result.currentProvider);
      toast.success("Database configuration updated", {
        description: "The new provider is active for this server instance.",
      });
      router.refresh();
    } catch (saveError) {
      console.error("Database configuration update failed:", saveError);
      const message =
        saveError instanceof Error ? saveError.message : "Unknown error";
      setError(message);
      toast.error("Failed to update database configuration", {
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Admin Database Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading database configuration...
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">Persisted runtime config</p>
                  <p>
                    This updates the active server instance immediately and
                    writes the chosen provider settings to
                    <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
                      .runtime/database-config.json
                    </code>
                    . Mount that path as a Docker volume if you want the change
                    to survive container rebuilds.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Database provider</label>
                <Select
                  value={form.provider}
                  onValueChange={(value) => updateProvider(value as DatabaseProvider)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">
                  Current provider summary
                </label>
                <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                  <div className="font-medium text-foreground capitalize">
                    {currentProvider}
                  </div>
                  <div>{activeSummary}</div>
                </div>
              </div>

              {form.provider === "azuresql" && (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Connection string</label>
                    <Textarea
                      value={form.azuresql.connectionString}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          azuresql: {
                            ...previous.azuresql,
                            connectionString: event.target.value,
                          },
                        }))
                      }
                      placeholder="Optional: paste a full Azure SQL connection string"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Server</label>
                    <Input
                      value={form.azuresql.server}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          azuresql: {
                            ...previous.azuresql,
                            server: event.target.value,
                          },
                        }))
                      }
                      placeholder="your-server.database.windows.net"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Database</label>
                    <Input
                      value={form.azuresql.database}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          azuresql: {
                            ...previous.azuresql,
                            database: event.target.value,
                          },
                        }))
                      }
                      placeholder="ScoutingDatabase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User</label>
                    <Input
                      value={form.azuresql.user}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          azuresql: {
                            ...previous.azuresql,
                            user: event.target.value,
                          },
                        }))
                      }
                      placeholder="Optional if using managed identity"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      value={form.azuresql.password}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          azuresql: {
                            ...previous.azuresql,
                            password: event.target.value,
                          },
                        }))
                      }
                      placeholder="Leave blank to keep the current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Managed identity</label>
                    <Select
                      value={form.azuresql.useManagedIdentity ? "yes" : "no"}
                      onValueChange={(value) =>
                        setForm((previous) => ({
                          ...previous,
                          azuresql: {
                            ...previous.azuresql,
                            useManagedIdentity: value === "yes",
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Enabled</SelectItem>
                        <SelectItem value="no">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {form.provider === "firebase" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service account path</label>
                    <Input
                      value={form.firebase.serviceAccountPath}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          firebase: {
                            ...previous.firebase,
                            serviceAccountPath: event.target.value,
                          },
                        }))
                      }
                      placeholder="/path/to/service-account.json"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Database URL</label>
                    <Input
                      value={form.firebase.databaseURL}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          firebase: {
                            ...previous.firebase,
                            databaseURL: event.target.value,
                          },
                        }))
                      }
                      placeholder="https://your-project.firebaseio.com"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">
                      Service account JSON
                    </label>
                    <Textarea
                      value={form.firebase.serviceAccountJson}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          firebase: {
                            ...previous.firebase,
                            serviceAccountJson: event.target.value,
                          },
                        }))
                      }
                      placeholder="Optional JSON object for inline credentials"
                    />
                  </div>
                </>
              )}

              {form.provider === "cosmos" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Endpoint</label>
                    <Input
                      value={form.cosmos.endpoint}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          cosmos: {
                            ...previous.cosmos,
                            endpoint: event.target.value,
                          },
                        }))
                      }
                      placeholder="https://account.documents.azure.com:443/"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Key</label>
                    <Input
                      type="password"
                      value={form.cosmos.key}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          cosmos: {
                            ...previous.cosmos,
                            key: event.target.value,
                          },
                        }))
                      }
                      placeholder="Leave blank to keep the current key"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Database ID</label>
                    <Input
                      value={form.cosmos.databaseId}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          cosmos: {
                            ...previous.cosmos,
                            databaseId: event.target.value,
                          },
                        }))
                      }
                      placeholder="database name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Container ID</label>
                    <Input
                      value={form.cosmos.containerId}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          cosmos: {
                            ...previous.cosmos,
                            containerId: event.target.value,
                          },
                        }))
                      }
                      placeholder="users"
                    />
                  </div>
                </>
              )}

              {form.provider === "mariadb" && (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Connection string</label>
                    <Textarea
                      value={form.mariadb.connectionString}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          mariadb: {
                            ...previous.mariadb,
                            connectionString: event.target.value,
                          },
                        }))
                      }
                      placeholder="Optional: full MariaDB connection string"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Host</label>
                    <Input
                      value={form.mariadb.host}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          mariadb: {
                            ...previous.mariadb,
                            host: event.target.value,
                          },
                        }))
                      }
                      placeholder="localhost"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Port</label>
                    <Input
                      value={form.mariadb.port}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          mariadb: {
                            ...previous.mariadb,
                            port: event.target.value,
                          },
                        }))
                      }
                      placeholder="3306"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Database</label>
                    <Input
                      value={form.mariadb.database}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          mariadb: {
                            ...previous.mariadb,
                            database: event.target.value,
                          },
                        }))
                      }
                      placeholder="athena"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User</label>
                    <Input
                      value={form.mariadb.user}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          mariadb: {
                            ...previous.mariadb,
                            user: event.target.value,
                          },
                        }))
                      }
                      placeholder="root"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      value={form.mariadb.password}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          mariadb: {
                            ...previous.mariadb,
                            password: event.target.value,
                          },
                        }))
                      }
                      placeholder="Leave blank to keep the current password"
                    />
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save configuration"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}