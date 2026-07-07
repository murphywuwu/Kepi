import type { EnemyType } from "@/types";
import { BALANCE, tulouStageForRepair } from "./balance";
import { ENEMY_TYPES } from "./enemies";
import { levelInteractionForStage } from "./levelInteractions";
import type { StageDefinition } from "./types";

/** Per-stage enemy pools — V3 seven-level route. */
export const STAGE_ENEMY_POOLS: Record<number, readonly EnemyType[]> = {
  1: ["qianhaibei", "luyinguanli"],
  2: ["qianhaibei", "luyinguanli"],
  3: ["luyinguanli", "qianhaibei", "zhuzaiqi"],
  4: ["zhuzaiqi", "luyinguanli", "ehushan"],
  5: ["ehushan", "zhuzaiqi", "luyinguanli", "hongtouchuan"],
  6: ["hongtouchuan", "ehushan", "zhuzaiqi", "xiedouhuo"],
  7: ENEMY_TYPES,
};

function enemyPoolForStage(stage: number): readonly EnemyType[] {
  return STAGE_ENEMY_POOLS[stage] ?? ENEMY_TYPES;
}

function stageScaling(stage: number): number {
  if (stage <= 2) return 1;
  if (stage === 3) return 1.35;
  if (stage === 4) return 1.7;
  if (stage === 5) return 1.95;
  if (stage === 6) return 2.15;
  return 2.5;
}

function enemyCountForStage(stage: number): number {
  if (stage <= 2) return 3;
  if (stage <= 4) return 4;
  return 5;
}

const STAGE_NAMES = [
  "南洋余波",
  "海禁余波",
  "关隘盘查",
  "契约束缚",
  "饿虎山",
  "红头船",
  "风浪归乡",
] as const;

/** Seven-level run — V3 interaction design v1. */
export const STAGES: readonly StageDefinition[] = Array.from(
  { length: 7 },
  (_, index) => {
    const stage = index + 1;
    const difficulty =
      stage <= 2 ? "tutorial" : stage <= 3 ? "normal" : stage <= 6 ? "hard" : "extreme";
    const interaction = levelInteractionForStage(stage);

    const expectedHomeRepair = Math.min(
      100,
      (stage - 1) * BALANCE.progression.homeRepairPerWin,
    );

    return {
      stage,
      name: interaction?.title ?? STAGE_NAMES[index]!,
      enemyCount: enemyCountForStage(stage),
      scaling: stageScaling(stage),
      enemyPool: interaction?.enemyComposition ?? enemyPoolForStage(stage),
      prepTimeSec: BALANCE.battle.prepTimeSec,
      difficulty,
      aiDynamic: stage >= 7,
      boardAsset: tulouStageForRepair(expectedHomeRepair).boardAsset,
    } satisfies StageDefinition;
  },
);

export function stageDefinition(stage: number): StageDefinition | undefined {
  return STAGES.find((entry) => entry.stage === stage);
}

export function stageScalingFactor(stage: number): number {
  return stageDefinition(stage)?.scaling ?? stageScaling(stage);
}

export function enemyCount(stage: number): number {
  return stageDefinition(stage)?.enemyCount ?? enemyCountForStage(stage);
}
