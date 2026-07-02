import { ASSET_MANIFEST } from "@/data/assets";
import { TULOU_BOARD_ASSETS, type TulouRepairStage } from "@/lib/game/assets";
import type { ScenePhase } from "@/types";

export type BackgroundLayer = {
  src: string;
  alpha: number;
};

export type TulouRepairStageDefinition = {
  id: TulouRepairStage;
  minRepair: number;
  maxRepair: number;
  src: string;
};

export const TULOU_REPAIR_STAGE_DEFINITIONS: readonly TulouRepairStageDefinition[] = [
  { id: "stage1", minRepair: 0, maxRepair: 15, src: TULOU_BOARD_ASSETS.stage1 },
  { id: "stage2", minRepair: 16, maxRepair: 31, src: TULOU_BOARD_ASSETS.stage2 },
  { id: "stage3", minRepair: 32, maxRepair: 47, src: TULOU_BOARD_ASSETS.stage3 },
  { id: "stage4", minRepair: 48, maxRepair: 63, src: TULOU_BOARD_ASSETS.stage4 },
  { id: "stage5", minRepair: 64, maxRepair: 79, src: TULOU_BOARD_ASSETS.stage5 },
  { id: "stage6", minRepair: 80, maxRepair: 100, src: TULOU_BOARD_ASSETS.stage6 },
] as const;

export function tulouRepairStageForValue(homeRepair: number): TulouRepairStageDefinition {
  const r = Number.isFinite(homeRepair)
    ? Math.max(0, Math.min(100, homeRepair))
    : 0;
  return (
    TULOU_REPAIR_STAGE_DEFINITIONS.find(
      (stage) => r >= stage.minRepair && r <= stage.maxRepair,
    ) ?? TULOU_REPAIR_STAGE_DEFINITIONS[TULOU_REPAIR_STAGE_DEFINITIONS.length - 1]!
  );
}

export function resolveTulouBackgroundLayers(homeRepair: number): BackgroundLayer[] {
  return [{ src: tulouExteriorForRepair(homeRepair), alpha: 1 }];
}

const EXTERIOR = ASSET_MANIFEST.board;

export const BATTLE_GROUND_SRC = EXTERIOR.battleGroundYard;

/** Exterior tulou backdrop — 4 tiers keyed to home repair (33 / 66 / 99). */
export function tulouExteriorForRepair(homeRepair: number): string {
  if (homeRepair >= 99) return EXTERIOR.tulouExteriorGlow;
  if (homeRepair >= 66) return EXTERIOR.tulouExteriorRenew;
  if (homeRepair >= 33) return EXTERIOR.tulouExteriorRepair;
  return EXTERIOR.tulouExteriorRuined;
}

export function resolveSceneBackgroundLayers(
  phase: ScenePhase,
  homeRepair: number,
): BackgroundLayer[] {
  if (phase === "prep" || phase === "battle" || phase === "settlement") {
    return [{ src: BATTLE_GROUND_SRC, alpha: 1 }];
  }
  return resolveTulouBackgroundLayers(homeRepair);
}

export const TULOU_BACKGROUND_SRCS = [
  BATTLE_GROUND_SRC,
  EXTERIOR.tulouExteriorRuined,
  EXTERIOR.tulouExteriorRepair,
  EXTERIOR.tulouExteriorRenew,
  EXTERIOR.tulouExteriorGlow,
] as const;
