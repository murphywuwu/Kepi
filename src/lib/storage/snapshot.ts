import type { GameSnapshot } from "@/types";
import { STORAGE_KEYS } from "./keys";
import { parseStoredSnapshot } from "./migrate";

export type SnapshotDiscardReason = "corrupt" | "legacy";

export function saveSnapshot(snapshot: GameSnapshot): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.snapshot, JSON.stringify(snapshot));
}

export function loadSnapshot(): GameSnapshot | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEYS.snapshot);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = parseStoredSnapshot(parsed);
    if (!result.ok) {
      if (result.reason === "legacy" || result.reason === "corrupt") {
        clearSnapshot();
      }
      return null;
    }
    return result.snapshot;
  } catch {
    clearSnapshot();
    return null;
  }
}

export function loadSnapshotWithMeta():
  | { snapshot: GameSnapshot; discarded: false }
  | { snapshot: null; discarded: false }
  | { snapshot: null; discarded: true; reason: SnapshotDiscardReason } {
  if (typeof window === "undefined") {
    return { snapshot: null, discarded: false };
  }

  const raw = window.localStorage.getItem(STORAGE_KEYS.snapshot);
  if (!raw) return { snapshot: null, discarded: false };

  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = parseStoredSnapshot(parsed);
    if (result.ok) {
      return { snapshot: result.snapshot, discarded: false };
    }
    if (result.reason === "legacy" || result.reason === "corrupt") {
      clearSnapshot();
      return { snapshot: null, discarded: true, reason: result.reason };
    }
    return { snapshot: null, discarded: false };
  } catch {
    clearSnapshot();
    return { snapshot: null, discarded: true, reason: "corrupt" };
  }
}

export function clearSnapshot(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.snapshot);
}

export function hasSavedSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEYS.snapshot) !== null;
}
