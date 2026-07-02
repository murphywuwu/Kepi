/**
 * Engine-facing re-exports from static data.
 * Game rules read configuration from `src/data`, not duplicated literals here.
 */
import type { PieceType, RangeType } from "@/types";
import {
  BALANCE,
  ENEMY_TYPES,
  PIECES,
  enemyCount,
  stageScalingFactor,
} from "@/data";

export const SNAPSHOT_VERSION = BALANCE.snapshotVersion;

export const INITIAL_GOLD = BALANCE.initial.gold;
export const INITIAL_POPULATION = BALANCE.initial.population;
export const MAX_POPULATION = BALANCE.population.max;
export const POPULATION_UPGRADE_COST = BALANCE.population.upgradeCost;
export const MAX_STAR = 2 as const;
export const STAR_HP_ATK_MULTIPLIER = BALANCE.progression.starHpAtkMultiplier;

export const SHOP_SLOT_COUNT = BALANCE.economy.shopSlotCount;
export const SHOP_REFRESH_COST = BALANCE.economy.shopRefreshCost;

export const ROUND_WAGE = BALANCE.economy.nodeWage;
export const NODE_WAGE = BALANCE.economy.nodeWage;
export const PAWN_KEBI_GOLD = BALANCE.economy.pawnGold;
export const BLOOD_DEBT_GOLD = BALANCE.economy.bloodDebtGold;
export const BASE_KEBI_THRESHOLD = BALANCE.journey.baseKebiThreshold;

export const SANGZI_PER_WIN = BALANCE.progression.sangziPerWin;
export const HOME_REPAIR_PER_WIN = BALANCE.progression.homeRepairPerWin;
export const XIANGXIAN_REPAIR_BONUS = BALANCE.progression.xiangxianRepairBonus;

export const BATTLE_TICK_MS = BALANCE.battle.tickMs;
export const BATTLE_MAX_MS = BALANCE.battle.maxMs;
export const BATTLE_TICKS_PER_FRAME_CAP = BALANCE.battle.ticksPerFrameCap;
export const BATTLE_ENEMY_HP_FACTOR = BALANCE.battle.enemyHpFactor;
export const BATTLE_DAMAGE_MULTIPLIER = BALANCE.battle.damageMultiplier;

export type PieceTemplate = {
  cost: number;
  hp: number;
  atk: number;
  atkSpeed: number;
  armor: number;
  range: RangeType;
  clan: string;
};

export const PIECE_TEMPLATES: Record<PieceType, PieceTemplate> = Object.fromEntries(
  Object.entries(PIECES).map(([type, def]) => [
    type,
    {
      cost: def.cost,
      hp: def.hp,
      atk: def.atk,
      atkSpeed: def.atkSpeed,
      armor: def.armor,
      range: def.range,
      clan: def.clan,
    },
  ]),
) as Record<PieceType, PieceTemplate>;

export { ENEMY_TYPES };

export function stageScaling(stage: number): number {
  return stageScalingFactor(stage);
}

export function enemyCountForStage(stage: number): number {
  return enemyCount(stage);
}
