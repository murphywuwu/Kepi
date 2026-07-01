import { gameSnapshotSchema } from "@/lib/schemas";
import type { GameSnapshot } from "@/types";

export type SnapshotLoadResult =
  | { ok: true; snapshot: GameSnapshot; migrated: boolean }
  | { ok: false; reason: "missing" | "corrupt" | "legacy" };

function isLegacyV16Shape(raw: Record<string, unknown>): boolean {
  const state = raw.state;
  if (!state || typeof state !== "object") return false;

  const gameState = state as Record<string, unknown>;
  if (raw.version === 1) return true;
  if (gameState.totalStages === 6) return true;
  if (gameState.kebiThreshold === 5) return true;
  if (!("pawnedKebi" in gameState) || !("homeRepairTier" in gameState)) {
    return true;
  }

  return false;
}

/** Parse localStorage JSON — migrates V2 snapshots, discards legacy V1.6 saves. */
export function parseStoredSnapshot(raw: unknown): SnapshotLoadResult {
  if (raw === null || raw === undefined) {
    return { ok: false, reason: "missing" };
  }

  if (typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    if (isLegacyV16Shape(record)) {
      return { ok: false, reason: "legacy" };
    }
  }

  const result = gameSnapshotSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, reason: "corrupt" };
  }

  return {
    ok: true,
    snapshot: result.data as GameSnapshot,
    migrated: false,
  };
}
