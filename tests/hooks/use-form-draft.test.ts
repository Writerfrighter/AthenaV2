// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFormDraft } from "@/hooks/use-form-draft";
import { draftOwner, loadDraft, saveDraft } from "@/lib/form-drafts";

type Form = { notes: string };

function useDraftedForm(key: string | null, initial: Form) {
  const [data, setData] = useState(initial);
  const restored = useFormDraft<Form>({
    key,
    data,
    isDirty: data.notes !== "",
    onRestore: setData,
    onReset: () => setData({ notes: "" }),
  });
  return { data, setData, restored };
}

describe("useFormDraft", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("restores once per key and reports each restore once", () => {
    saveDraft("a", { notes: "saved" });
    const { result, rerender } = renderHook(({ key }) => useDraftedForm(key, { notes: "" }), {
      initialProps: { key: "a" as string | null },
    });
    expect(result.current.data.notes).toBe("saved");
    const first = result.current.restored;
    expect(first).toEqual({ key: "a" });

    rerender({ key: "a" });
    expect(result.current.restored).toBe(first);
  });

  it("starts a fresh context without moving or deleting the previous draft", () => {
    const { result, rerender } = renderHook(({ key }) => useDraftedForm(key, { notes: "typed" }), {
      initialProps: { key: "a" },
    });
    expect(loadDraft("a")).toEqual({ notes: "typed" });

    rerender({ key: "b" });
    expect(result.current.data.notes).toBe("");
    expect(loadDraft("b")).toBeNull();
    expect(loadDraft("a")).toEqual({ notes: "typed" });
    act(() => result.current.setData({ notes: "second scout" }));
    rerender({ key: "a" });
    expect(result.current.data.notes).toBe("typed");
    expect(loadDraft("b")).toEqual({ notes: "second scout" });
  });

  it("preserves the old draft when storage cannot save in a new context", () => {
    const { result, rerender } = renderHook(({ key }) => useDraftedForm(key, { notes: "typed" }), {
      initialProps: { key: "a" },
    });
    vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("Storage full"); });
    rerender({ key: "b" });
    act(() => result.current.setData({ notes: "new entry" }));
    expect(loadDraft("a")).toEqual({ notes: "typed" });
    expect(loadDraft("b")).toBeNull();
  });

  it("restores again after drafts are disabled and re-enabled", () => {
    saveDraft("a", { notes: "saved" });
    const { result, rerender } = renderHook(({ key }) => useDraftedForm(key, { notes: "" }), {
      initialProps: { key: "a" as string | null },
    });
    const first = result.current.restored;
    rerender({ key: null });
    expect(result.current.restored).toBeNull();
    act(() => result.current.setData({ notes: "unrelated edit" }));
    rerender({ key: "a" });
    expect(result.current.data.notes).toBe("saved");
    expect(result.current.restored).not.toBe(first);
  });

  it("keeps the old draft when the new key restores its own", () => {
    saveDraft("b", { notes: "other" });
    const { result, rerender } = renderHook(({ key }) => useDraftedForm(key, { notes: "typed" }), {
      initialProps: { key: "a" },
    });
    rerender({ key: "b" });
    expect(result.current.data.notes).toBe("other");
    expect(loadDraft("a")).toEqual({ notes: "typed" });
    expect(loadDraft("b")).toEqual({ notes: "other" });
  });
});

describe("draftOwner", () => {
  it("keys tablet drafts by the selected scout", () => {
    expect(draftOwner({ id: "u1", role: "scout" }, false, null)).toBe("u1");
    expect(draftOwner({ id: "t1", role: "tablet" }, false, null)).toBeNull();
    expect(draftOwner({ id: "t1", role: "tablet" }, false, "s2")).toBe("t1~s2");
    expect(draftOwner(undefined, true, null)).toBe("guest");
    expect(draftOwner(undefined, false, null)).toBeNull();
  });
});
