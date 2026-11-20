"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { YearConfig } from "@/lib/types";
import { validateYearConfig } from "@/lib/game-config/config-validator";
import { getErrorMessage } from "@/lib/utils";

interface BuilderJsonEditorProps {
  config: YearConfig;
  year: number;
  onUpdateConfig: (newConfig: YearConfig) => void;
  onApplied: () => void;
}

export function BuilderJsonEditor({
  config,
  year,
  onUpdateConfig,
  onApplied,
}: BuilderJsonEditorProps) {
  const [jsonText, setJsonText] = useState("");
  const [copied, setCopied] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Synchronize incoming config with the text. Done during render so the
  // editor never shows the previous config's JSON.
  const [syncedConfig, setSyncedConfig] = useState<YearConfig | null>(null);
  if (syncedConfig !== config) {
    setSyncedConfig(config);
    try {
      const formatted = JSON.stringify(config, null, 2);
      setJsonText(formatted);
      setParseError(null);

      const val = validateYearConfig(config);
      setValidationErrors(val.errors);
      setValidationWarnings(val.warnings);
    } catch (err) {
      setParseError(getErrorMessage(err));
    }
  }

  const handleTextChange = (val: string) => {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      setParseError(null);
      const valRes = validateYearConfig(parsed);
      setValidationErrors(valRes.errors);
      setValidationWarnings(valRes.warnings);

    } catch (err) {
      setParseError(getErrorMessage(err));
    }
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const validation = validateYearConfig(parsed);
      if (!validation.valid) return;
      onUpdateConfig(parsed);
      onApplied();
      toast.info("JSON applied. Choose Save Config to publish your changes.");
    } catch (error) {
      setParseError(getErrorMessage(error));
    }
  };

  const handlePrettify = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setParseError(null);
      toast.success("JSON formatted successfully");
    } catch (err) {
      toast.error(`Invalid JSON syntax: ${getErrorMessage(err)}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    toast.success("JSON copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${config.competitionType || "FRC"}-${year || 2026}.json`;
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const valRes = validateYearConfig(parsed);
        if (!valRes.valid) {
          toast.warning("Imported JSON has schema validation issues", {
            description: valRes.errors.join(", "),
          });
        }
        handleTextChange(JSON.stringify(parsed, null, 2));
        toast.success(`Imported ${file.name}`);
      } catch (err) {
        toast.error(`Failed to parse file: ${getErrorMessage(err)}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePrettify}>Format</Button>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}><Download /> Download</Button>
        <label className="cursor-pointer">
          <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
          <Button variant="outline" size="sm" asChild>
            <span><Upload /> Import file</span>
          </Button>
        </label>
      </div>
          {/* Syntax / Validation Status Banner */}
          {parseError ? (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>JSON Syntax Error: {parseError}</span>
            </div>
          ) : validationErrors.length > 0 ? (
            <div className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="h-4 w-4" /> Schema Validation Errors:
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded-md text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Valid configuration</span>
            </div>
          )}

          {!parseError && validationWarnings.length > 0 && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs">
              <p className="font-semibold">Configuration warnings</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {validationWarnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
          )}

          <div className="relative">
            <Textarea
              aria-label="Configuration JSON"
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="h-[500px] resize-y p-4 font-mono text-xs leading-relaxed"
              placeholder="{ ... }"
              spellCheck={false}
            />
          </div>
          <Button onClick={handleApply} disabled={!!parseError || validationErrors.length > 0}>
            Apply JSON to editor
          </Button>
    </div>
  );
}
