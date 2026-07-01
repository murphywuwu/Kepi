import type { EnemyType } from "@/types";
import { BALANCE, tulouStageForRepair } from "./balance";
import { ENEMY_TYPES } from "./enemies";
import type { StageDefinition } from "./types";

/** Per-stage enemy pools — V2.0 §7.5 (4-stage micro-run). */
export const STAGE_ENEMY_POOLS: Record<number, readonly EnemyType[]> = {
  1: ["qianhaibei", "luyinguanli"],
  2: ["qianhaibei", "luyinguanli", "zhuzaiqi"],
  3: ["zhuzaiqi", "ehushan", "hongtouchuan"],
  4: ENEMY_TYPES,
};

function enemyPoolForStage(stage: number): readonly EnemyType[] {
  return STAGE_ENEMY_POOLS[stage] ?? ENEMY_TYPES;
}

function stageScaling(stage: number): number {
  if (stage <= 1) return 1;
  if (stage <= 3) return 1.5;
  return 2;
}

function enemyCountForStage(stage: number): number {
  if (stage <= 1) return 3;
  if (stage <= 3) return 4;
  return 5;
}

const STAGE_NAMES = [
  "海禁余波",
  "关隘盘查",
  "契约束缚",
  "风浪前夕",
] as const;

/** Four-stage micro-run — V2.0. */
export const STAGES: readonly StageDefinition[] = Array.from(
  { length: 4 },
  (_, index) => {
    const stage = index + 1;
    const difficulty =
      stage <= 2 ? "tutorial" : stage <= 4 ? "normal" : "hard";

    const expectedHomeRepair = Math.min(
      100,
      (stage - 1) * BALANCE.progression.homeRepairPerWin,
    );

    return {
      stage,
      name: STAGE_NAMES[index]!,
      enemyCount: enemyCountForStage(stage),
      scaling: stageScaling(stage),
      enemyPool: enemyPoolForStage(stage),
      prepTimeSec: 30,
      difficulty,
      aiDynamic: stage >= 4,
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
