import { PIECES } from "@/data/pieces";
import { detectHomeRepairMilestone } from "@/engine/tulouBuff";
import type { BattleResult, GameSnapshot, Piece } from "@/types";
import type { TurnNarrativeInput } from "./types";

function detectClutchUnit(
  result: BattleResult,
  allies: Piece[] | undefined,
): string | undefined {
  if (!result.won || !allies?.length) return undefined;

  const survivors = allies.filter((ally) => ally.hp > 0);
  if (survivors.length === 0) return undefined;

  const isClutch =
    result.alliesRemaining === 1 ||
    (result.allyHpPercent > 0 && result.allyHpPercent <= 0.35);
  if (!isClutch) return undefined;

  const clutch = survivors.reduce(
    (best, ally) => {
      const ratio = ally.maxHp > 0 ? ally.hp / ally.maxHp : 0;
      return ratio < best.ratio ? { ally, ratio } : best;
    },
    {
      ally: survivors[0]!,
      ratio: survivors[0]!.maxHp > 0 ? survivors[0]!.hp / survivors[0]!.maxHp : 0,
    },
  );

  return PIECES[clutch.ally.type]?.name ?? clutch.ally.type;
}

function detectOutcomeTone(
  result: BattleResult,
): "crushing" | "clutch" | "narrow" | undefined {
  if (!result.won) return undefined;
  if (result.enemyHpPercent <= 0.05 && result.allyHpPercent >= 0.55) {
    return "crushing";
  }
  if (result.alliesRemaining === 1 || result.allyHpPercent <= 0.35) {
    return "clutch";
  }
  return "narrow";
}

export function buildTurnNarrativeInput(
  snapshot: GameSnapshot,
): TurnNarrativeInput | null {
  const { settlement, lastBattleResult, state, battle } = snapshot;
  if (!settlement || !lastBattleResult) return null;

  const allies = battle?.allies ?? snapshot.board;
  const deathCount = Math.max(0, 2 - state.survival);

  return {
    turn: state.journeyIndex + 1,
    events: {
      didPawn: state.roundPawnCount > 0,
      pawnCount: state.roundPawnCount,
      didBloodDebt: state.roundBloodDebt,
      waterGuestDied: settlement.waterGuestDied,
      waterGuestSurvived: settlement.waterGuestSurvived,
      won: settlement.won,
      clutchUnit: detectClutchUnit(lastBattleResult, allies),
      outcomeTone: detectOutcomeTone(lastBattleResult),
      homeRepairMilestone:
        settlement.homeRepairMilestone ??
        detectHomeRepairMilestone(
          settlement.homeRepairBefore,
          settlement.homeRepairAfter,
        ) ??
        undefined,
    },
    currentKebi: state.kebi,
    currentHomeRepair: settlement.homeRepairAfter,
    survival: state.survival,
    winStreak: state.winStreak,
    deathCount,
  };
}
