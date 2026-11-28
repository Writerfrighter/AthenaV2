"use client";

import { useState } from "react";
import { AlertCircle, Check, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { YearConfig } from "@/lib/types";
import { validateYearConfig } from "@/lib/game-config/config-validator";
import { getErrorMessage } from "@/lib/utils";
import { buildAiPrompt, buildFixPrompt, extractJson } from "./ai-prompt";
import { hint } from "./fields";

/** Copy a prompt into any chat AI, then paste its JSON back to apply it. */
export function AiDraftDialog({ open, onOpenChange, config, year, onApply }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: YearConfig;
  year: number;
  onApply: (config: YearConfig) => void;
}) {
  const [manualUrl, setManualUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [startFromCurrent, setStartFromCurrent] = useState(true);
  const [copied, setCopied] = useState<"prompt" | "fix" | null>(null);
  const [reply, setReply] = useState("");

  const prompt = buildAiPrompt({ config, year, manualUrl, notes, startFromCurrent });

  // Parsed and validated as the reply is pasted, so problems show before Apply.
  let parsed: YearConfig | null = null;
  let problem: string | null = null;
  let errors: string[] = [];
  let warnings: string[] = [];
  if (reply.trim()) {
    try {
      parsed = extractJson(reply) as YearConfig;
      const result = validateYearConfig(parsed);
      errors = result.errors;
      warnings = result.warnings;
    } catch (error) {
      problem = getErrorMessage(error);
    }
  }

  const copy = async (text: string, which: "prompt" | "fix") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it yourself.");
    }
  };

  const apply = () => {
    if (!parsed || errors.length) return;
    // The AI never sees the field image, so keep the one already uploaded.
    onApply({ ...parsed, fieldImage: parsed.fieldImage ?? config.fieldImage });
    setReply("");
    onOpenChange(false);
    toast.success("AI draft applied. Review each tab, then choose Save & publish. Undo puts the old config back.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Draft with AI</DialogTitle>
          <DialogDescription>
            Too much to set up by hand? Copy a prompt into your favorite AI service. It asks you a few questions
            about how your team scouts, then writes the whole config for you to paste back here.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">1. Copy the prompt</h3>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Game manual link (recommended)</span>
            <Input
              type="url"
              placeholder="https://… the official game manual PDF"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
            />
            <span className={hint}>The AI reads point values from it instead of guessing. Many chat AIs can't open PDF links: if it asks, upload the manual PDF into the chat.</span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Anything it should know (optional)</span>
            <Textarea
              rows={2}
              placeholder="e.g. We only have 4 scouts. We care most about cycle speed and climbing."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              Start from the current config
              <span className={`block ${hint}`}>Off for a new game: the AI designs fresh fields.</span>
            </span>
            <Switch checked={startFromCurrent} onCheckedChange={setStartFromCurrent} />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => copy(prompt, "prompt")}>
              {copied === "prompt" ? <Check /> : <Copy />} {copied === "prompt" ? "Copied" : "Copy prompt"}
            </Button>
            <span className={hint}>Paste it into a new chat and answer its questions.</span>
          </div>
          <details>
            <summary className="cursor-pointer text-xs text-muted-foreground">See the prompt</summary>
            <Textarea readOnly aria-label="AI prompt" value={prompt} className="mt-2 h-48 font-mono text-xs" />
          </details>
        </section>

        <section className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-semibold">2. Paste the AI&apos;s answer</h3>
          <Textarea
            aria-label="AI reply"
            rows={6}
            placeholder="Paste the whole reply, or just the ```json block."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="font-mono text-xs"
            spellCheck={false}
          />
          {problem && (
            <p className="flex items-start gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" /> {problem}
            </p>
          )}
          {errors.length > 0 && (
            <div className="space-y-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
              <p className="font-semibold">The app can&apos;t use this yet:</p>
              <ul className="list-disc space-y-0.5 pl-5">
                {errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
              <Button size="sm" variant="outline" onClick={() => copy(buildFixPrompt(errors), "fix")}>
                {copied === "fix" ? <Check /> : <Copy />} Copy these back to the AI
              </Button>
            </div>
          )}
          {parsed && !problem && errors.length === 0 && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-green-600" />
              Looks valid{warnings.length > 0 ? `, with ${warnings.length} reference${warnings.length === 1 ? "" : "s"} to check after applying` : ""}.
            </p>
          )}
          <Button onClick={apply} disabled={!parsed || !!problem || errors.length > 0}>
            Apply to editor
          </Button>
        </section>
      </DialogContent>
    </Dialog>
  );
}
