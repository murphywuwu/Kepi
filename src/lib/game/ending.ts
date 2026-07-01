import {
  buildEndingBattleSummary,
  type EndingNarrativeContext,
} from "@/data/letters";
import { resolveEndingType } from "@/engine/progression";
import type { EndingType, GameSnapshot } from "@/types";

export type { EndingNarrativeContext };

/** Build narrative inputs for the ending scene from engine snapshot. */
export function endingContextFromSnapshot(
  snapshot: GameSnapshot,
): EndingNarrativeContext {
  const { state, settlement, lastBattleResult } = snapshot;
  const waterGuest = settlement ?? lastBattleResult?.waterGuest;

  return {
    kebi: state.kebi,
    kebiThreshold: state.kebiThreshold,
    pawnedKebi: state.pawnedKebi,
    homeRepairTier: state.homeRepairTier,
    waterGuestSurvived:
      settlement?.waterGuestSurvived ?? lastBattleResult?.waterGuest.survived ?? false,
    waterGuestDied:
      settlement?.waterGuestDied ?? lastBattleResult?.waterGuest.died ?? false,
  };
}

export function resolveSnapshotEndingType(snapshot: GameSnapshot): EndingType {
  if (snapshot.state.endingType) {
    return snapshot.state.endingType;
  }
  if (snapshot.state.survival <= 0) {
    return resolveEndingType(snapshot.state, "elimination");
  }
  return resolveEndingType(snapshot.state, "final_stage");
}

export function endingBattleSummaryFromSnapshot(
  snapshot: GameSnapshot,
): string {
  const endingType = resolveSnapshotEndingType(snapshot);
  const ctx = endingContextFromSnapshot(snapshot);
  return buildEndingBattleSummary(endingType, ctx, snapshot.state.stage);
}
