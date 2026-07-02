import type { TulouVisualStage } from "./types";

/** Balance tables — V3.1 journey run (~10–12 min). */
export const BALANCE = {
  snapshotVersion: 3,

  initial: {
    stage: 1,
    totalStages: 7,
    totalNodes: 7,
    journeyIndex: 0,
    currentNodeId: "camp-1",
    survival: 2,
    kebi: 0,
    kebiThreshold: 5,
    sangzi: 0,
    homeRepair: 0,
    homeRepairTier: 0 as const,
    gold: 10,
    population: 3,
    winStreak: 0,
    loseStreak: 0,
    pawnedKebi: 0,
    bloodDebtCount: 0,
    roundPawnCount: 0,
    roundBloodDebt: false,
    nextBattleEnemyHpFactor: 1,
    result: null,
    endingType: null,
  },

  journey: {
    baseKebiThreshold: 5,
  },

  population: {
    max: 6,
    upgradeCost: 4,
  },

  economy: {
    /** Fixed wage when completing a journey node. */
    nodeWage: 5,
    shopRefreshCost: 1,
    shopSlotCount: 5,
    /** Gold granted when pawning one letter (kebi). */
    pawnGold: 15,
    /** Gold granted when borrowing against return threshold. */
    bloodDebtGold: 35,
  },

  battle: {
    tickMs: 8,
    maxMs: 40_000,
    ticksPerFrameCap: 22,
    prepTimeSec: 30,
    damageFormula: "atk * 100 / (100 + armor)" as const,
    /** Tuning knob — lowers enemy HP so typical lineups finish before the 40s cap. */
    enemyHpFactor: 0.55,
    /** Tuning knob — global combat damage multiplier. */
    damageMultiplier: 1.75,
  },

  progression: {
    sangziPerWin: 20,
    /** Base 1:1 sangzi→repair;乡贤在场时用 xiangxianRepairBonus 倍率 */
    homeRepairPerWin: 20,
    starHpAtkMultiplier: 2,
    /** 乡贤在场时桑梓→修复转化率 +50% */
    xiangxianRepairBonus: 1.5,
  },

  tulouBuff: {
    shieldRatio: 0.2,
    atkSpeedBonus: 0.15,
    cheatDeathInvincibleMs: 1500,
    milestones: [33, 66, 99] as const,
  },

  clanSynergy: {
    thresholds: [2, 3, 4] as const,
    atkBonus: [0.1, 0.2, 0.3] as const,
    /** 落叶归根 — max tier juice ultimate. */
    leafFall: {
      minClanCount: 4,
      durationMs: 8000,
      atkSpeedBonus: 0.35,
      lifestealRatio: 0.15,
    },
  },

  openingBuff: {
    catchWindowMs: 5000,
  },

  teacherSkill: {
    adjacentAtkSpeedBonus: 0.1,
  },

  fengshuiSkill: {
    allyAtkBonus: 0.2,
    durationRounds: 1,
  },

  publicWelfareEvent: {
    atkPenalty: 0.2,
    homeRepairBonus: 10,
  },
} as const;

export const TULOU_VISUAL_STAGES: readonly TulouVisualStage[] = [
  {
    id: "stage1",
    minRepair: 0,
    maxRepair: 15,
    label: "破败",
    boardAsset: "/images/board/kepi_tulou-stage1-broken.png",
    transitionAsset: null,
  },
  {
    id: "stage2",
    minRepair: 16,
    maxRepair: 31,
    label: "井台复水",
    boardAsset: "/images/board/kepi_tulou-stage2-well.png",
    transitionAsset: null,
  },
  {
    id: "stage3",
    minRepair: 32,
    maxRepair: 47,
    label: "墙门修缮",
    boardAsset: "/images/board/kepi_tulou-stage3-gate.png",
    transitionAsset: null,
  },
  {
    id: "stage4",
    minRepair: 48,
    maxRepair: 63,
    label: "屋瓦补齐",
    boardAsset: "/images/board/kepi_tulou-stage4-roof.png",
    transitionAsset: null,
  },
  {
    id: "stage5",
    minRepair: 64,
    maxRepair: 79,
    label: "祠堂点灯",
    boardAsset: "/images/board/kepi_tulou-stage5-lanterns.png",
    transitionAsset: null,
  },
  {
    id: "stage6",
    minRepair: 80,
    maxRepair: 100,
    label: "桑梓焕新",
    boardAsset: "/images/board/kepi_tulou-stage6-renewed.png",
    transitionAsset: null,
  },
] as const;

/** V2.0 combat buff tiers — 33% / 66% / 99% milestones. */
export function homeRepairTierFromRepair(homeRepair: number): 0 | 1 | 2 | 3 {
  const r = Math.max(0, Math.min(100, homeRepair));
  if (r >= 99) return 3;
  if (r >= 66) return 2;
  if (r >= 33) return 1;
  return 0;
}

export function homeRepairVisualStage(
  homeRepair: number,
): TulouVisualStage["id"] {
  const r = Math.max(0, Math.min(100, homeRepair));
  if (r < 16) return "stage1";
  if (r < 32) return "stage2";
  if (r < 48) return "stage3";
  if (r < 64) return "stage4";
  if (r < 80) return "stage5";
  return "stage6";
}

export function tulouStageForRepair(homeRepair: number): TulouVisualStage {
  const id = homeRepairVisualStage(homeRepair);
  return TULOU_VISUAL_STAGES.find((stage) => stage.id === id)!;
}
