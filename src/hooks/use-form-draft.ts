"use client";

import { useEffect, useState } from "react";
import { clearDraft, loadDraft, saveDraft } from "@/lib/form-drafts";

interface UseFormDraftOptions<T> {
  /** Storage key for this form context, or null to disable drafts (e.g. edit mode). */
  key: string | null;
  data: T;
  /** Whether the current data holds anything worth keeping. */
  isDirty: boolean;
  /** Called during render with a stored draft the first time a key becomes available. */
  onRestore: (draft: T) => void;
  /** Reset the form when entering a different context without a saved draft. */
  onReset: () => void;
}

/** Identifies one restore; a new object each time, so effects fire once per restore. */
export interface RestoredDraft {
  key: string;
}

/**
 * Restores a saved draft once per key, then keeps localStorage in step with
 * the form: dirty data is saved, pristine data (e.g. after submit) clears it.
 * Each context keeps its own draft. A new context starts with its saved draft
 * or a fresh form; changing context never deletes the previous draft.
 * Returns the most recent restore so callers can notify once.
 */
export function useFormDraft<T>({ key, data, isDirty, onRestore, onReset }: UseFormDraftOptions<T>) {
  const [checked, setChecked] = useState<{ key: string | null } | null>(null);
  const [restored, setRestored] = useState<RestoredDraft | null>(null);

  if (checked?.key !== key) {
    const draft = key ? loadDraft<T>(key) : null;
    setChecked({ key });
    setRestored(null);
    if (key && draft) {
      setRestored({ key });
      onRestore(draft);
    } else if (key && checked) {
      onReset();
    }
  }

  useEffect(() => {
    // Wait until the stored draft (if any) has been restored, or the pristine
    // initial form would wipe it.
    if (!key || checked?.key !== key) return;
    if (!isDirty) {
      clearDraft(key);
      return;
    }
    saveDraft(key, data);
  }, [key, checked, data, isDirty]);

  return restored;
}
