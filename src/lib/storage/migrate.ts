import { gameSnapshotSchema } from "@/lib/schemas";
import { BALANCE } from "@/data/balance";
import { JOURNEY } from "@/data/journey";
import { computeKebiThreshold } from "@/engine/journey";
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
  if (!("pawnedKebi" in gameState) || !("homeRepairTier" in gameState)) {
    return true;
  }

  return false;
}

function migrateV2ToV3(snapshot: GameSnapshot): GameSnapshot {
  const state = snapshot.state;
  const bloodDebtCount = state.bloodDebtCount ?? 0;
  return {
    ...snapshot,
    version: BALANCE.snapshotVersion,
    openingBuff: snapshot.openingBuff ?? null,
    activeOpeningBuff: snapshot.activeOpeningBuff ?? null,
    campfire: snapshot.campfire ?? null,
    state: {
      ...state,
      totalNodes: state.totalNodes ?? JOURNEY.nodes.length,
      totalStages: state.totalStages ?? JOURNEY.nodes.length,
      journeyIndex: state.journeyIndex ?? Math.max(0, state.stage - 1),
      currentNodeId:
        state.currentNodeId ?? JOURNEY.nodes[state.journeyIndex ?? 0]?.id ?? "camp-1",
      bloodDebtCount,
      roundBloodDebt: state.roundBloodDebt ?? false,
      nextBattleEnemyHpFactor: state.nextBattleEnemyHpFactor ?? 1,
      kebiThreshold: computeKebiThreshold(bloodDebtCount),
    },
  };
}

/** Parse localStorage JSON — migrates V2→V3, discards legacy V1.6 saves. */
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

  let snapshot = result.data as GameSnapshot;
  let migrated = false;

  if (snapshot.version < BALANCE.snapshotVersion) {
    snapshot = migrateV2ToV3(snapshot);
    migrated = true;
  }

  return {
    ok: true,
    snapshot,
    migrated,
  };
}
