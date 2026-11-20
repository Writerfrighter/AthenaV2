"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { notifyGameConfigUpdated } from "@/lib/game-config/updates";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Code, Copy, Monitor, Pencil, Plus, Save, Smartphone, Tablet, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import type { YearConfig } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";
import { DEFAULT_NEW_CONFIG, getSection, uniqueKey, updateSection } from "./types";
import { ComponentPalette, PALETTE, PaletteComponentType } from "./component-palette";
import { VisualCanvas } from "./visual-canvas";
import { PropertyInspector, SelectedComponentInfo } from "./property-inspector";
import { VisualMatchupCanvas } from "./visual-matchup-canvas";
import { VisualTeamPageCanvas } from "./visual-teampage-canvas";
import { AnalysisEditor } from "./analysis-editor";
import { BuilderJsonEditor } from "./builder-json-editor";
import { validateYearConfig } from "@/lib/game-config/config-validator";

interface ConfigOption {
  filename: string;
  competitionType: string;
  year: number;
  gameName: string;
  isBuiltin: boolean;
}

export type StudioDesignerMode = "match" | "pit" | "matchup" | "teampage" | "analysis";

const MODES: [StudioDesignerMode, string][] = [
  ["match", "Match form"],
  ["pit", "Pit form"],
  ["matchup", "Matchup card"],
  ["teampage", "Team page"],
  ["analysis", "Analysis"],
];

async function loadConfigList(): Promise<ConfigOption[]> {
  const res = await fetch("/api/scouting/admin/configs", { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !Array.isArray(data.configs)) {
    throw new Error(data.error || "Failed to load saved configurations");
  }
  return data.configs;
}

async function loadSavedConfig(filename?: string) {
  const configs = filename ? undefined : await loadConfigList();
  filename ??= configs?.find((config) => config.filename === "FRC-2026.json")?.filename ?? configs?.[0]?.filename;
  if (!filename) return { configs, filename: "", config: undefined };
  const res = await fetch(`/api/scouting/admin/configs?file=${encodeURIComponent(filename)}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !data.config) throw new Error(data.error || "Failed to load saved configuration");
  const validation = validateYearConfig(data.config);
  if (!validation.valid) throw new Error(validation.errors.join(", "));
  return { configs, filename, config: data.config as YearConfig };
}

export function GameConfigStudio() {
  const [configList, setConfigList] = useState<ConfigOption[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [currentConfig, setCurrentConfig] = useState<YearConfig>(() => structuredClone(DEFAULT_NEW_CONFIG));
  const [savedConfig, setSavedConfig] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadVersion = useRef(0);
  const isDirty = selectedFile !== "" && JSON.stringify(currentConfig) !== savedConfig;
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const referenceWarnings = React.useMemo(
    () => validateYearConfig(currentConfig).warnings,
    [currentConfig],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createCompetitionType, setCreateCompetitionType] = useState<"FRC" | "FTC">("FRC");
  const [createYear, setCreateYear] = useState(new Date().getFullYear() + 1);
  const [createGameName, setCreateGameName] = useState("NEW_GAME");
  const [renameCompetitionType, setRenameCompetitionType] = useState<"FRC" | "FTC">("FRC");
  const [renameYear, setRenameYear] = useState(2026);
  const [renameGameName, setRenameGameName] = useState("");

  // Studio Modes & State
  const [studioMode, setStudioMode] = useState<StudioDesignerMode>("match");
  const [activeSection, setActiveSection] = useState<string>("autonomous");
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [viewportDevice, setViewportDevice] = useState<"responsive" | "tablet" | "phone">("responsive");
  const [selectedComponent, setSelectedComponent] = useState<SelectedComponentInfo | null>(null);

  // Advanced Raw JSON Modal
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState<boolean>(false);

  // Fetch configs list from server
  const fetchConfigs = async () => {
    try {
      setConfigList(await loadConfigList());
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // Commit the filename and contents together, only after a successful read.
  const loadSelectedConfig = useCallback((filename?: string) => {
    const version = ++loadVersion.current;
    return loadSavedConfig(filename).then((data) => {
      if (version !== loadVersion.current) return;
      if (data.configs) setConfigList(data.configs);
      setSelectedFile(data.filename);
      if (!data.config) {
        setCurrentConfig(structuredClone(DEFAULT_NEW_CONFIG));
        return;
      }
      setCurrentConfig(data.config);
      setSavedConfig(JSON.stringify(data.config));
      setCurrentYear(Number(data.filename.match(/-(\d{4})\.json$/i)?.[1]));
      setSelectedComponent(null);
    }).catch((error) => {
      if (version === loadVersion.current) setLoadError(getErrorMessage(error));
    }).finally(() => {
      if (version === loadVersion.current) setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const requests = loadVersion;
    void loadSelectedConfig();
    return () => { requests.current++; };
  }, [loadSelectedConfig]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const handleSelectConfig = async (filename: string) => {
    if (isDirty && !window.confirm("Discard unsaved configuration changes?")) return;
    setIsLoading(true);
    setLoadError(null);
    await loadSelectedConfig(filename);
  };

  const openCreateDialog = () => {
    if (isDirty && !window.confirm("Discard unsaved configuration changes?")) return;
    const frcYears = configList
      .filter((config) => config.competitionType === "FRC")
      .map((config) => config.year);
    setCreateCompetitionType("FRC");
    setCreateYear(Math.max(new Date().getFullYear(), ...frcYears) + 1);
    setCreateGameName("NEW_GAME");
    setIsCreateDialogOpen(true);
  };

  // Create and persist a new year config.
  const handleCreateNew = async () => {
    const gameName = createGameName.trim();
    if (!Number.isInteger(createYear) || createYear < 1990 || createYear > 9999) {
      toast.error("Enter a valid four-digit year");
      return;
    }
    if (!gameName) {
      toast.error("Enter a game name");
      return;
    }

    const freshConfig = JSON.parse(JSON.stringify(DEFAULT_NEW_CONFIG)) as YearConfig;
    freshConfig.competitionType = createCompetitionType;
    freshConfig.gameName = gameName;
    const filename = `${createCompetitionType}-${createYear}.json`;

    try {
      setIsCreating(true);
      const res = await fetch("/api/scouting/admin/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionType: createCompetitionType,
          year: createYear,
          filename,
          config: freshConfig,
          createOnly: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create configuration");

      setCurrentConfig(data.config);
      setSavedConfig(JSON.stringify(data.config));
      setCurrentYear(createYear);
      setSelectedFile(data.filename);
      setSelectedComponent(null);
      setIsCreateDialogOpen(false);
      await fetchConfigs();
      toast.success(`Created ${data.filename}`);
      notifyGameConfigUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create configuration");
    } finally {
      setIsCreating(false);
    }
  };

  const openRenameDialog = () => {
    setRenameCompetitionType(currentConfig.competitionType || "FRC");
    setRenameYear(currentYear);
    setRenameGameName(currentConfig.gameName || "");
    setIsRenameDialogOpen(true);
  };

  const handleRenameConfig = async () => {
    const gameName = renameGameName.trim();
    if (!Number.isInteger(renameYear) || renameYear < 1990 || renameYear > 9999) {
      toast.error("Enter a valid four-digit year");
      return;
    }
    if (!gameName) {
      toast.error("Enter a game name");
      return;
    }

    try {
      setIsRenaming(true);
      const res = await fetch("/api/scouting/admin/configs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedFile,
          competitionType: renameCompetitionType,
          year: renameYear,
          gameName,
          config: currentConfig,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename configuration");

      setCurrentConfig(data.config);
      setSavedConfig(JSON.stringify(data.config));
      setCurrentYear(renameYear);
      setSelectedFile(data.filename);
      setSelectedComponent(null);
      setIsRenameDialogOpen(false);
      await fetchConfigs();
      toast.success(`Renamed configuration to ${data.filename}`);
      notifyGameConfigUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename configuration");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteConfig = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/scouting/admin/configs?file=${encodeURIComponent(selectedFile)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete configuration");
      setIsDeleteDialogOpen(false);
      toast.success(`Deleted ${selectedFile}`);
      notifyGameConfigUpdated();
      setIsLoading(true);
      await loadSelectedConfig();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to delete configuration");
    } finally {
      setIsDeleting(false);
    }
  };

  // Duplicate current config
  const handleDuplicateCurrent = () => {
    let nextYear = currentYear + 1;
    while (configList.some((config) => config.filename === `${currentConfig.competitionType}-${nextYear}.json`)) nextYear++;
    const cloned = JSON.parse(JSON.stringify(currentConfig)) as YearConfig;
    cloned.gameName = `${cloned.gameName || "GAME"}_COPY`;
    setCurrentConfig(cloned);
    setCurrentYear(nextYear);
    setSelectedFile(`${cloned.competitionType}-${nextYear}.json`);
    setSelectedComponent(null);
    toast.info(`Duplicated configuration as ${cloned.competitionType}-${nextYear}`);
  };

  // Save config to server
  const handleSaveToServer = async () => {
    if (isLoading || isSaving || !selectedFile) return;
    const compType = currentConfig.competitionType || "FRC";
    const filename = `${compType}-${currentYear}.json`;

    try {
      setIsSaving(true);
      const res = await fetch("/api/scouting/admin/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionType: compType,
          year: currentYear,
          filename,
          config: currentConfig,
          createOnly: !configList.some((config) => config.filename === filename),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.errors?.join(", ") || data.error || "Failed to save configuration");
      }

      toast.success(`Saved configuration to ${filename}`);
      setSavedConfig(JSON.stringify(data.config));
      notifyGameConfigUpdated();
      void fetchConfigs();
      setSelectedFile(filename);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const formMode = studioMode === "match" || studioMode === "pit" ? studioMode : null;
  const isSavedFile = configList.some((config) => config.filename === selectedFile);

  // Add a field from the palette, by click or drop.
  const handleAddComponent = (type: PaletteComponentType, sectionTarget?: string) => {
    if (!formMode) return;
    const section = sectionTarget || activeSection;
    const item = PALETTE[formMode].find((entry) => entry.type === type);
    if (!item) return;
    const fieldKey = uniqueKey(getSection(currentConfig, formMode, section), item.key);
    setCurrentConfig((prev) =>
      updateSection(prev, formMode, section, (fields) => ({
        ...fields,
        [fieldKey]: structuredClone(item.definition),
      })),
    );
    setSelectedComponent({ mode: formMode, section, fieldKey });
  };

  const handleReorderComponents = (section: string, order: string[]) => {
    if (!formMode) return;
    setCurrentConfig((prev) =>
      updateSection(prev, formMode, section, (fields) =>
        Object.fromEntries(order.filter((key) => key in fields).map((key) => [key, fields[key]])),
      ),
    );
  };

  const handleDuplicateComponent = (comp: SelectedComponentInfo) => {
    const fields = getSection(currentConfig, comp.mode, comp.section);
    const source = fields[comp.fieldKey];
    if (!source) return;
    const fieldKey = uniqueKey(fields, `${comp.fieldKey}_copy`);
    setCurrentConfig((prev) =>
      updateSection(prev, comp.mode, comp.section, (current) => ({
        ...current,
        [fieldKey]: { ...source, label: `${source.label} (Copy)` },
      })),
    );
    setSelectedComponent({ ...comp, fieldKey });
  };

  const handleDeleteComponent = (comp: SelectedComponentInfo) => {
    setCurrentConfig((prev) =>
      updateSection(prev, comp.mode, comp.section, (fields) => {
        const next = { ...fields };
        delete next[comp.fieldKey];
        return next;
      }),
    );
    if (
      selectedComponent?.mode === comp.mode &&
      selectedComponent.section === comp.section &&
      selectedComponent.fieldKey === comp.fieldKey
    ) {
      setSelectedComponent(null);
    }
  };

  if (isLoading) {
    return <p role="status" className="py-6 text-muted-foreground">Loading saved configuration…</p>;
  }

  if (loadError && !selectedFile) {
    return <div role="alert" className="space-y-3 rounded-xl border p-6">
      <p>{loadError}</p>
      <Button onClick={() => {
        setIsLoading(true);
        setLoadError(null);
        void loadSelectedConfig();
      }}>Retry loading configurations</Button>
    </div>;
  }

  const sideColumn = "lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto";

  return (
    <div className="flex flex-col gap-5" inert={isSaving || isCreating || isRenaming || isDeleting}>
      {loadError && <p role="alert" className="text-destructive">{loadError}. Your previous configuration is still open.</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedFile} onValueChange={handleSelectConfig}>
          <SelectTrigger aria-label="Configuration" className="w-64">
            <SelectValue placeholder="Select a configuration" />
          </SelectTrigger>
          <SelectContent>
            {configList.map((cfg) => (
              <SelectItem key={cfg.filename} value={cfg.filename}>
                {cfg.competitionType} {cfg.year} · {cfg.gameName || cfg.filename}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={openCreateDialog}><Plus /> New</Button>
        <Button variant="outline" size="sm" onClick={openRenameDialog} disabled={!isSavedFile}><Pencil /> Rename</Button>
        <Button variant="outline" size="sm" onClick={handleDuplicateCurrent} disabled={!selectedFile}><Copy /> Clone</Button>
        <Button variant="outline" size="sm" onClick={() => setIsDeleteDialogOpen(true)} disabled={!isSavedFile}><Trash2 /> Delete</Button>

        <p role="status" className="ml-auto text-sm text-muted-foreground">
          {!selectedFile
            ? "No saved configurations. Choose New to create one."
            : !isSavedFile
              ? `Unsaved changes: saving creates ${selectedFile}`
              : isDirty ? "Unsaved changes" : "All changes saved"}
        </p>
        <Button variant="outline" size="sm" onClick={() => setIsJsonDialogOpen(true)}><Code /> JSON</Button>
        <Button size="sm" onClick={handleSaveToServer} disabled={isSaving || !isDirty}>
          <Save /> {isSaving ? "Saving..." : "Save Config"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <Tabs
          value={studioMode}
          onValueChange={(mode) => {
            setStudioMode(mode as StudioDesignerMode);
            setActiveSection("autonomous");
            setSelectedComponent(null);
          }}
        >
          <TabsList>
            {MODES.map(([mode, label]) => (
              <TabsTrigger key={mode} value={mode} className="flex-none">{label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {formMode && (
          <div className="flex items-center gap-4">
            <ToggleGroup
              type="single"
              size="sm"
              aria-label="Preview width"
              value={viewportDevice}
              onValueChange={(value) => {
                if (value) setViewportDevice(value as typeof viewportDevice);
              }}
              className="hidden sm:flex"
            >
              <ToggleGroupItem value="responsive" aria-label="Full width"><Monitor /></ToggleGroupItem>
              <ToggleGroupItem value="tablet" aria-label="Tablet width"><Tablet /></ToggleGroupItem>
              <ToggleGroupItem value="phone" aria-label="Phone width"><Smartphone /></ToggleGroupItem>
            </ToggleGroup>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={isTestMode}
                onCheckedChange={(on) => {
                  setIsTestMode(on);
                  if (on) setSelectedComponent(null);
                }}
              />
              Test the form
            </label>
          </div>
        )}
      </div>

      {referenceWarnings.length > 0 && (
        <details className="border-b pb-3 text-sm">
          <summary className="flex cursor-pointer items-center gap-2 font-medium">
            <TriangleAlert className="size-4 text-amber-600" />
            {referenceWarnings.length} reference{referenceWarnings.length === 1 ? "" : "s"} to check
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-9 text-xs text-muted-foreground">
            {referenceWarnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </details>
      )}

      {formMode ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
          <div className={sideColumn}>
            <ComponentPalette scoutingMode={formMode} onAddComponent={(type) => handleAddComponent(type)} />
          </div>
          <VisualCanvas
            config={currentConfig}
            year={currentYear}
            scoutingMode={formMode}
            activeSection={activeSection}
            isTestMode={isTestMode}
            viewportDevice={viewportDevice}
            selectedComponent={selectedComponent}
            onSectionChange={(section) => {
              setActiveSection(section);
              setSelectedComponent(null);
            }}
            onSelectComponent={setSelectedComponent}
            onDuplicateComponent={handleDuplicateComponent}
            onDeleteComponent={handleDeleteComponent}
            onDropComponent={handleAddComponent}
            onReorderComponents={handleReorderComponents}
          />
          <div className={sideColumn}>
            <PropertyInspector
              // Remount per field so half-typed "add" inputs never carry over
              key={selectedComponent ? `${selectedComponent.section}.${selectedComponent.fieldKey}` : "game"}
              config={currentConfig}
              year={currentYear}
              selectedComponent={selectedComponent}
              onUpdateConfig={setCurrentConfig}
              onSelectComponent={setSelectedComponent}
              onDuplicateComponent={handleDuplicateComponent}
              onDeleteComponent={handleDeleteComponent}
            />
          </div>
        </div>
      ) : studioMode === "matchup" ? (
        <VisualMatchupCanvas config={currentConfig} onUpdateConfig={setCurrentConfig} />
      ) : studioMode === "teampage" ? (
        <VisualTeamPageCanvas config={currentConfig} year={currentYear} onUpdateConfig={setCurrentConfig} />
      ) : (
        <AnalysisEditor config={currentConfig} onUpdateConfig={setCurrentConfig} />
      )}

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfig}
        loading={isDeleting}
        title={`Delete ${selectedFile}?`}
        description="Scouting forms, team pages and analysis for this season stop working until a configuration for it exists again. Entries already recorded are kept."
      />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a game year</DialogTitle>
            <DialogDescription>
              Creates and saves a new blank scouting configuration immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Competition program</Label>
              <Select value={createCompetitionType} onValueChange={(value: "FRC" | "FTC") => setCreateCompetitionType(value)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRC">FRC</SelectItem>
                  <SelectItem value="FTC">FTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-config-year">Year</Label>
              <Input id="create-config-year" type="number" min={1990} max={9999} value={createYear}
                onChange={(event) => setCreateYear(Number(event.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-config-name">Game name</Label>
              <Input id="create-config-name" value={createGameName}
                onChange={(event) => setCreateGameName(event.target.value)} placeholder="NEW_GAME" />
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleCreateNew} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create year"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename configuration</DialogTitle>
            <DialogDescription>
              Change the game name, season, or competition program. Changing the season or program renames the config file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Competition program</Label>
              <Select value={renameCompetitionType} onValueChange={(value: "FRC" | "FTC") => setRenameCompetitionType(value)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRC">FRC</SelectItem>
                  <SelectItem value="FTC">FTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rename-config-year">Year</Label>
              <Input id="rename-config-year" type="number" min={1990} max={9999} value={renameYear}
                onChange={(event) => setRenameYear(Number(event.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rename-config-name">Game name</Label>
              <Input id="rename-config-name" value={renameGameName}
                onChange={(event) => setRenameGameName(event.target.value)} />
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleRenameConfig} disabled={isRenaming}>
              {isRenaming ? "Renaming..." : "Rename configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuration JSON</DialogTitle>
            <DialogDescription>
              Edit or import JSON and apply it to the editor, then choose Save Config to publish.
            </DialogDescription>
          </DialogHeader>
          <BuilderJsonEditor
            config={currentConfig}
            year={currentYear}
            onUpdateConfig={setCurrentConfig}
            onApplied={() => setIsJsonDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
