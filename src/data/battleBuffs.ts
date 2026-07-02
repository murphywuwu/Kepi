/** Opening battle buffs — ≤3 kinds for 乡音符 blind box. */

export type BattleOpeningBuffId = "ancestral_blessing" | "travel_rations" | "wind_at_back";

export type BattleOpeningBuff = {
  id: BattleOpeningBuffId;
  label: string;
  description: string;
  /** Ally atk multiplier applied for this battle. */
  atkMultiplier: number;
  /** Optional flat gold granted at battle start. */
  goldBonus?: number;
};

export const BATTLE_OPENING_BUFFS: Record<BattleOpeningBuffId, BattleOpeningBuff> = {
  ancestral_blessing: {
    id: "ancestral_blessing",
    label: "祖灵庇佑",
    description: "全军攻击 +12%",
    atkMultiplier: 1.12,
  },
  travel_rations: {
    id: "travel_rations",
    label: "行路干粮",
    description: "开局 +3 金币",
    atkMultiplier: 1,
    goldBonus: 3,
  },
  wind_at_back: {
    id: "wind_at_back",
    label: "顺风归潮",
    description: "全军攻速 +8%",
    atkMultiplier: 1.08,
  },
};

export const OPENING_BUFF_IDS = Object.keys(
  BATTLE_OPENING_BUFFS,
) as BattleOpeningBuffId[];

/** Weak fallback when the player misses the 乡音符 window. */
export const OPENING_BUFF_TIMEOUT_WEAK: BattleOpeningBuff = {
  id: "travel_rations",
  label: "余音未绝",
  description: "微弱顺风 (+4% 攻击)",
  atkMultiplier: 1.04,
};
