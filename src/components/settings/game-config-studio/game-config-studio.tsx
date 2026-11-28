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
import {
  ChartLine,
  ClipboardList,
  Code,
  Columns2,
  Copy,
  Ellipsis,
  Monitor,
  PanelsTopLeft,
  Pencil,
  Play,
  Plus,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  TriangleAlert,
  Undo2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import type { YearConfig } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";
import { DEFAULT_NEW_CONFIG, getSection, uniqueKey, updateSection } from "./types";
import { PALETTE, type PaletteComponentType } from "./component-palette";
import { FormOutline } from "./form-outline";
import { VisualCanvas, type PreviewDevice } from "./visual-canvas";
import { Segmented, hint } from "./fields";
import { PropertyInspector, SelectedComponentInfo } from "./property-inspector";
import { VisualMatchupCanvas } from "./visual-matchup-canvas";
import { VisualTeamPageCanvas } from "./visual-teampage-canvas";
import { AnalysisEditor } from "./analysis-editor";
import { BuilderJsonEditor } from "./builder-json-editor";
import { AiDraftDialog } from "./ai-draft-dialog";
import { validateYearConfig } from "@/lib/game-config/config-validator";

interface ConfigOption {
  filename: string;
  competitionType: string;
  year: number;
  gameName: string;
  isBuiltin: boolean;
}

export type StudioDesignerMode = "match" | "pit" | "matchup" | "teampage" | "analysis";

const MODES: [StudioDesignerMode, string, LucideIcon][] = [
  ["match", "Match form", ClipboardList],
  ["pit", "Pit form", Wrench],
  ["matchup", "Matchup card", Columns2],
  ["teampage", "Team page", PanelsTopLeft],
  ["analysis", "Analysis", ChartLine],
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
  // Latest config, so several edits in one event build on each other.
  const configRef = useRef(currentConfig);
  const [history, setHistory] = useState<YearConfig[]>([]);
  const lastEditAt = useRef(0);
  /** Replaces the config without recording an undo step (loads, saves, renames). */
  const setConfig = useCallback((config: YearConfig) => {
    configRef.current = config;
    setCurrentConfig(config);
    setHistory([]);
  }, []);
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
  const [device, setDevice] = useState<PreviewDevice>("tablet");
  const [selectedComponent, setSelectedComponent] = useState<SelectedComponentInfo | null>(null);

  /** Applies an edit and records an undo step; quick successive edits (typing) undo together. */
  const editConfig = (updater: (prev: YearConfig) => YearConfig) => {
    const previous = configRef.current;
    const next = updater(previous);
    if (next === previous) return;
    const now = Date.now();
    if (now - lastEditAt.current > 800) setHistory((steps) => [...steps.slice(-49), previous]);
    lastEditAt.current = now;
    configRef.current = next;
    setCurrentConfig(next);
  };

  const handleUndo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((steps) => steps.slice(0, -1));
    configRef.current = previous;
    setCurrentConfig(previous);
    setSelectedComponent(null);
    lastEditAt.current = 0;
  };

  const switchMode = (mode: StudioDesignerMode) => {
    setStudioMode(mode);
    setActiveSection("autonomous");
    setSelectedComponent(null);
    setIsTestMode(false);
    // Match scouts work on tablets; pit scouts on phones.
    if (mode === "match") setDevice("tablet");
    if (mode === "pit") setDevice("phone");
  };

  // Advanced Raw JSON Modal
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState<boolean>(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

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
        setConfig(structuredClone(DEFAULT_NEW_CONFIG));
        return;
      }
      setConfig(data.config);
      setSavedConfig(JSON.stringify(data.config));
      setCurrentYear(Number(data.filename.match(/-(\d{4})\.json$/i)?.[1]));
      setSelectedComponent(null);
    }).catch((error) => {
      if (version === loadVersion.current) setLoadError(getErrorMessage(error));
    }).finally(() => {
      if (version === loadVersion.current) setIsLoading(false);
    });
  }, [setConfig]);

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

      setConfig(data.config);
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

      setConfig(data.config);
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
    setConfig(cloned);
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

  // Add a field to a section: at the end, or right after `afterKey`.
  const handleAddComponent = (type: PaletteComponentType, sectionTarget?: string, afterKey?: string) => {
    if (!formMode) return;
    const section = sectionTarget || activeSection;
    const item = PALETTE[formMode].find((entry) => entry.type === type);
    if (!item) return;
    const fieldKey = uniqueKey(getSection(currentConfig, formMode, section), item.key);
    editConfig((prev) =>
      updateSection(prev, formMode, section, (fields) => {
        const entries = Object.entries(fields);
        const at = afterKey ? entries.findIndex(([key]) => key === afterKey) + 1 : entries.length;
        entries.splice(at || entries.length, 0, [fieldKey, structuredClone(item.definition) as (typeof fields)[string]]);
        return Object.fromEntries(entries);
      }),
    );
    setIsTestMode(false);
    setActiveSection(section);
    setSelectedComponent({ mode: formMode, section, fieldKey });
  };

  const handleReorderComponents = (section: string, order: string[]) => {
    if (!formMode) return;
    editConfig((prev) =>
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
    editConfig((prev) =>
      updateSection(prev, comp.mode, comp.section, (current) => ({
        ...current,
        [fieldKey]: { ...source, label: `${source.label} (Copy)` },
      })),
    );
    setSelectedComponent({ ...comp, fieldKey });
  };

  const handleDeleteComponent = (comp: SelectedComponentInfo) => {
    editConfig((prev) =>
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
  const unsaved = !selectedFile ? null : !isSavedFile || isDirty;

  return (
    <div className="flex flex-col gap-5" inert={isSaving || isCreating || isRenaming || isDeleting}>
      {loadError && <p role="alert" className="text-destructive">{loadError}. Your previous configuration is still open.</p>}

      <header className="flex flex-col border-b">
        {/* One picker, the rarely used actions behind ⋯, and one primary action */}
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <Select value={selectedFile} onValueChange={handleSelectConfig}>
            <SelectTrigger aria-label="Configuration" className="h-9 w-auto min-w-56 gap-2">
              <SelectValue placeholder="Select a configuration" />
            </SelectTrigger>
            <SelectContent>
              {configList.map((cfg) => (
                <SelectItem key={cfg.filename} value={cfg.filename}>
                  <span className="rounded-full bg-foreground px-1.5 text-[11px] font-semibold text-background">{cfg.competitionType}</span>
                  {cfg.year} · {cfg.gameName || cfg.filename}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="More configuration actions">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onSelect={openCreateDialog}><Plus /> New game year</DropdownMenuItem>
              <DropdownMenuItem onSelect={openRenameDialog} disabled={!isSavedFile}><Pencil /> Rename</DropdownMenuItem>
              <DropdownMenuItem onSelect={handleDuplicateCurrent} disabled={!selectedFile}><Copy /> Clone as next year</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsAiDialogOpen(true)} disabled={!selectedFile}><Sparkles /> Draft with AI</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsJsonDialogOpen(true)}><Code /> Edit as JSON</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setIsDeleteDialogOpen(true)} disabled={!isSavedFile}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1" />

          {referenceWarnings.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <TriangleAlert />
                  {referenceWarnings.length} reference{referenceWarnings.length === 1 ? "" : "s"} to check
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-96">
                <p className="mb-2 text-sm font-medium">These point at fields that don&apos;t exist</p>
                <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  {referenceWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              </PopoverContent>
            </Popover>
          )}

          <p role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {unsaved !== null && (
              <span aria-hidden="true" className={`size-2 rounded-full ${unsaved ? "bg-amber-500" : "bg-green-600"}`} />
            )}
            {!selectedFile
              ? "No saved configurations. Choose New from the ⋯ menu."
              : !isSavedFile
                ? `Unsaved changes: saving creates ${selectedFile}`
                : isDirty ? "Unsaved changes" : "All changes saved"}
          </p>
          <Button variant="outline" size="icon-sm" aria-label="Undo" title="Undo" onClick={handleUndo} disabled={history.length === 0}>
            <Undo2 />
          </Button>
          <Button size="sm" onClick={handleSaveToServer} disabled={isSaving || !isDirty}>
            <Save /> {isSaving ? "Saving..." : "Save & publish"}
          </Button>
        </div>

        {/* Named by where scouts and analysts see each part */}
        <nav aria-label="What to design" className="-mb-px flex flex-wrap gap-1 overflow-x-auto">
          {MODES.map(([mode, label, Icon]) => (
            <button
              key={mode}
              type="button"
              aria-current={studioMode === mode ? "page" : undefined}
              onClick={() => switchMode(mode)}
              className={`flex h-11 items-center gap-2 border-b-2 px-3.5 text-sm font-medium transition-colors ${
                studioMode === mode ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {formMode ? (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
          <div className={sideColumn}>
            <FormOutline
              config={currentConfig}
              mode={formMode}
              activeSection={activeSection}
              selected={selectedComponent}
              onSelectSection={(section) => {
                setActiveSection(section);
                setSelectedComponent(null);
              }}
              onSelectField={(section, fieldKey) => {
                setIsTestMode(false);
                setActiveSection(section);
                setSelectedComponent({ mode: formMode, section, fieldKey });
              }}
              onAdd={(type, section) => handleAddComponent(type, section)}
              onReorder={handleReorderComponents}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented
                label="Preview mode"
                className="w-auto"
                value={isTestMode ? "try" : "edit"}
                options={[
                  ["edit", "Edit", Pencil],
                  ["try", "Try it as a scout", Play],
                ]}
                onChange={(value) => {
                  setIsTestMode(value === "try");
                  if (value === "try") setSelectedComponent(null);
                }}
              />
              <Segmented
                label="Preview device"
                className="hidden w-auto sm:flex"
                value={device}
                options={[
                  ["tablet", "Tablet", Tablet],
                  ["phone", "Phone", Smartphone],
                  ["desktop", "Desktop", Monitor],
                ]}
                onChange={setDevice}
              />
            </div>
            <VisualCanvas
              config={currentConfig}
              scoutingMode={formMode}
              activeSection={activeSection}
              isTestMode={isTestMode}
              device={device}
              selectedComponent={selectedComponent}
              onSectionChange={(section) => {
                setActiveSection(section);
                setSelectedComponent(null);
              }}
              onSelectComponent={setSelectedComponent}
              onInsertComponent={handleAddComponent}
              onReorderComponents={handleReorderComponents}
            />
            {!isTestMode && (
              <p className={`${hint} text-center`}>Click a field to edit it. Drag fields to reorder them.</p>
            )}
          </div>
          <div className={sideColumn}>
            <PropertyInspector
              // Remount per field so half-typed "add" inputs never carry over
              key={selectedComponent ? `${selectedComponent.section}.${selectedComponent.fieldKey}` : "game"}
              config={currentConfig}
              year={currentYear}
              selectedComponent={selectedComponent}
              onUpdateConfig={editConfig}
              onSelectComponent={setSelectedComponent}
              onDuplicateComponent={handleDuplicateComponent}
              onDeleteComponent={handleDeleteComponent}
              onNavigate={switchMode}
            />
          </div>
        </div>
      ) : studioMode === "matchup" ? (
        <VisualMatchupCanvas config={currentConfig} onUpdateConfig={editConfig} />
      ) : studioMode === "teampage" ? (
        <VisualTeamPageCanvas config={currentConfig} year={currentYear} onUpdateConfig={editConfig} />
      ) : (
        <AnalysisEditor config={currentConfig} onUpdateConfig={editConfig} />
      )}

      <AiDraftDialog
        open={isAiDialogOpen}
        onOpenChange={setIsAiDialogOpen}
        config={currentConfig}
        year={currentYear}
        onApply={(next) => {
          editConfig(() => next);
          setSelectedComponent(null);
        }}
      />

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
            onUpdateConfig={(next) => editConfig(() => next)}
            onApplied={() => setIsJsonDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
