import type { HomeRepairTier, Piece } from "@/types";
import { BALANCE } from "@/data/balance";

export type HomeRepairMilestone = 33 | 66 | 99;

export type TulouBattleBuffs = {
  tier: HomeRepairTier;
  /** Extra HP buffer consumed before real HP (tier ≥ 1). */
  shieldHp: Record<string, number>;
  /** Ally ids that still have their one cheat-death (tier ≥ 3). */
  cheatDeathAvailable: Set<string>;
  /** Per-unit invincibility deadline (ms elapsed in battle). */
  invincibleUntil: Record<string, number>;
};

const MILESTONES: readonly HomeRepairMilestone[] = [33, 66, 99];

export function detectHomeRepairMilestone(
  before: number,
  after: number,
): HomeRepairMilestone | null {
  for (const milestone of MILESTONES) {
    if (before < milestone && after >= milestone) return milestone;
  }
  return null;
}

export function createTulouBattleBuffs(
  allies: Piece[],
  tier: HomeRepairTier,
): TulouBattleBuffs {
  const shieldHp: Record<string, number> = {};
  const cheatDeathAvailable = new Set<string>();

  if (tier >= 1) {
    for (const ally of allies) {
      shieldHp[ally.id] = Math.round(ally.maxHp * BALANCE.tulouBuff.shieldRatio);
    }
  }

  if (tier >= 3) {
    for (const ally of allies) {
      cheatDeathAvailable.add(ally.id);
    }
  }

  return {
    tier,
    shieldHp,
    cheatDeathAvailable,
    invincibleUntil: {},
  };
}

export function effectiveAllyAtkSpeed(
  baseAtkSpeed: number,
  tier: HomeRepairTier,
): number {
  if (tier < 2 || baseAtkSpeed <= 0) return baseAtkSpeed;
  return baseAtkSpeed * (1 + BALANCE.tulouBuff.atkSpeedBonus);
}

export type TulouDamageResult = {
  hp: number;
  shieldHp: number;
  events: Array<{ type: "skill"; sourceId: string; skillId: string }>;
  invincibleUntil: number | null;
  cheatDeathConsumed: boolean;
};

/** Apply incoming damage to an ally, respecting shield, invincibility, and cheat-death. */
export function applyTulouDamageToAlly(
  unitId: string,
  hp: number,
  maxHp: number,
  damage: number,
  buffs: TulouBattleBuffs,
  elapsedMs: number,
): TulouDamageResult {
  const events: Array<{ type: "skill"; sourceId: string; skillId: string }> = [];
  const invUntil = buffs.invincibleUntil[unitId] ?? 0;
  if (elapsedMs < invUntil) {
    return {
      hp,
      shieldHp: buffs.shieldHp[unitId] ?? 0,
      events,
      invincibleUntil: invUntil,
      cheatDeathConsumed: false,
    };
  }

  let remaining = damage;
  let shield = buffs.shieldHp[unitId] ?? 0;
  if (shield > 0 && remaining > 0) {
    const absorbed = Math.min(shield, remaining);
    shield -= absorbed;
    remaining -= absorbed;
  }

  let nextHp = hp - remaining;

  if (nextHp <= 0 && buffs.cheatDeathAvailable.has(unitId)) {
    buffs.cheatDeathAvailable.delete(unitId);
    nextHp = 1;
    const invincibleUntil = elapsedMs + BALANCE.tulouBuff.cheatDeathInvincibleMs;
    events.push({ type: "skill", sourceId: unitId, skillId: "tulou_cheat_death" });
    return {
      hp: nextHp,
      shieldHp: shield,
      events,
      invincibleUntil,
      cheatDeathConsumed: true,
    };
  }

  return {
    hp: Math.max(0, nextHp),
    shieldHp: shield,
    events,
    invincibleUntil: null,
    cheatDeathConsumed: false,
  };
}
