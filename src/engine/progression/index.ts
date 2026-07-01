import type { BattleResult, EndingType, GameResult, GameSnapshot } from "@/types";
import { homeRepairTierFromRepair } from "@/data/balance";
import {
  HOME_REPAIR_PER_WIN,
  SANGZI_PER_WIN,
  XIANGXIAN_REPAIR_BONUS,
} from "../constants";
import { hasXiangxianPresent } from "../waterGuest";
import { detectHomeRepairMilestone } from "../tulouBuff";

function emptySettlementFields(won: boolean, state: GameSnapshot["state"]) {
  return {
    won,
    kebiGained: 0,
    sangziGained: 0,
    sangziConsumed: 0,
    homeRepairBefore: state.homeRepair,
    homeRepairGained: 0,
    homeRepairAfter: state.homeRepair,
    survivalLost: won ? 0 : 1,
    waterGuestDeployed: false,
    waterGuestSurvived: false,
    waterGuestDied: false,
    xiangxianBonusApplied: false,
    homeRepairMilestone: null,
  };
}

/** Map the three V2.0 endings onto legacy win/lose for AI and storage. */
export function gameResultFromEndingType(endingType: EndingType): GameResult {
  return endingType === "perfect_homecoming" ? "win" : "lose";
}

/** Resolve which of the three endings applies. */
export function resolveEndingType(
  state: GameSnapshot["state"],
  trigger: "elimination" | "final_stage",
): EndingType {
  if (trigger === "elimination" || state.survival <= 0) {
    return "storm_rescue";
  }
  return state.kebi >= state.kebiThreshold
    ? "perfect_homecoming"
    : "regretful_stay";
}

export function settleStage(
  snapshot: GameSnapshot,
  result: BattleResult,
): GameSnapshot {
  const { state } = snapshot;
  const waterGuest = result.waterGuest;
  const allies = snapshot.battle?.allies ?? snapshot.board;

  if (result.won) {
    const letterCollected = waterGuest.deployed && waterGuest.survived;

    if (!letterCollected) {
      return {
        ...snapshot,
        state: {
          ...state,
          winStreak: state.winStreak + 1,
          loseStreak: 0,
        },
        lastBattleResult: result,
        settlement: {
          ...emptySettlementFields(true, state),
          waterGuestDeployed: waterGuest.deployed,
          waterGuestSurvived: false,
          waterGuestDied: waterGuest.died,
        },
      };
    }

    const sangziGained = SANGZI_PER_WIN;
    const availableSangzi = state.sangzi + sangziGained;
    const sangziConsumed = Math.min(availableSangzi, SANGZI_PER_WIN);
    const homeRepairBefore = state.homeRepair;
    const xiangxianBonusApplied = hasXiangxianPresent(allies);
    const repairGain = Math.round(
      HOME_REPAIR_PER_WIN *
        (xiangxianBonusApplied ? XIANGXIAN_REPAIR_BONUS : 1),
    );
    const homeRepairAfter = Math.min(100, homeRepairBefore + repairGain);
    const homeRepairMilestone = detectHomeRepairMilestone(
      homeRepairBefore,
      homeRepairAfter,
    );

    return {
      ...snapshot,
      state: {
        ...state,
        kebi: state.kebi + 1,
        sangzi: availableSangzi - sangziConsumed,
        winStreak: state.winStreak + 1,
        loseStreak: 0,
      },
      lastBattleResult: result,
      settlement: {
        won: true,
        kebiGained: 1,
        sangziGained,
        sangziConsumed,
        homeRepairBefore,
        homeRepairGained: homeRepairAfter - homeRepairBefore,
        homeRepairAfter,
        survivalLost: 0,
        waterGuestDeployed: true,
        waterGuestSurvived: true,
        waterGuestDied: false,
        xiangxianBonusApplied,
        homeRepairMilestone,
      },
    };
  }

  return {
    ...snapshot,
    state: {
      ...state,
      survival: state.survival - 1,
      winStreak: 0,
      loseStreak: state.loseStreak + 1,
    },
    lastBattleResult: result,
    settlement: {
      ...emptySettlementFields(false, state),
      waterGuestDeployed: waterGuest.deployed,
      waterGuestSurvived: waterGuest.survived,
      waterGuestDied: waterGuest.died,
    },
  };
}

/** Apply pending home repair after the victory cinematic (board swaps here). */
export function applyHomeRepairFromSettlement(
  snapshot: GameSnapshot,
): GameSnapshot {
  const settlement = snapshot.settlement;
  if (!settlement?.won) return snapshot;
  if (settlement.kebiGained <= 0) return snapshot;
  if (snapshot.state.homeRepair >= settlement.homeRepairAfter) return snapshot;

  return {
    ...snapshot,
    state: {
      ...snapshot.state,
      homeRepair: settlement.homeRepairAfter,
      homeRepairTier: homeRepairTierFromRepair(settlement.homeRepairAfter),
    },
  };
}

function enterEnding(
  snapshot: GameSnapshot,
  endingType: EndingType,
): GameSnapshot {
  return {
    ...snapshot,
    phase: "ending",
    state: {
      ...snapshot.state,
      result: gameResultFromEndingType(endingType),
      endingType,
    },
  };
}

export function resolveProgression(snapshot: GameSnapshot): GameSnapshot {
  const { state, lastBattleResult } = snapshot;
  const won = lastBattleResult?.won ?? false;

  if (!won && state.survival <= 0) {
    return enterEnding(snapshot, resolveEndingType(state, "elimination"));
  }

  if (won && state.stage >= state.totalStages) {
    return enterEnding(snapshot, resolveEndingType(state, "final_stage"));
  }

  if (won) {
    return {
      ...snapshot,
      state: {
        ...state,
        stage: state.stage + 1,
        result: state.result ?? "playing",
      },
    };
  }

  return {
    ...snapshot,
    state: {
      ...state,
      result: state.result ?? "playing",
    },
  };
}

export { homeRepairVisualStage as homeRepairStage } from "@/data/balance";
