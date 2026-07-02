import type { GameSnapshot } from "@/types";
import { findCampfireChoice } from "@/data/campfire";
import { homeRepairTierFromRepair } from "@/data/balance";
import { applyNodeWage } from "../economy";
import {
  currentJourneyNode,
  enterJourneyNode,
  isFinalJourneyNode,
} from "../journey";
import { enterEnding, resolveProgressionAfterBattle } from "../progression";

export function applyCampfireChoice(
  snapshot: GameSnapshot,
  choiceId: string,
): GameSnapshot {
  if (snapshot.phase !== "campfire") return snapshot;

  const choice = findCampfireChoice(choiceId);
  if (!choice) return snapshot;

  const { effect } = choice;
  let { state } = snapshot;

  switch (effect.kind) {
    case "gold":
      state = { ...state, gold: state.gold + (effect.gold ?? 0) };
      break;
    case "homeRepair": {
      const homeRepair = Math.min(100, state.homeRepair + (effect.homeRepair ?? 0));
      state = {
        ...state,
        homeRepair,
        homeRepairTier: homeRepairTierFromRepair(homeRepair),
      };
      break;
    }
    case "nextBattleDebuff":
      state = {
        ...state,
        nextBattleEnemyHpFactor: effect.nextBattleEnemyHpFactor ?? 1,
      };
      break;
    case "kebiHint":
      break;
    default:
      break;
  }

  return advanceJourney({
    ...snapshot,
    state,
    campfire: null,
  });
}

export function leavePawnShop(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.phase !== "pawn_shop") return snapshot;
  return advanceJourney(snapshot);
}

/** Advance to the next journey node after completing the current one. */
export function advanceJourney(snapshot: GameSnapshot): GameSnapshot {
  const won = snapshot.lastBattleResult?.won;
  const fromBattle = snapshot.phase === "settlement";

  if (fromBattle && won === false) {
    return snapshot;
  }

  let next = applyNodeWage(snapshot);
  const nextIndex = next.state.journeyIndex + 1;

  if (fromBattle && won && isFinalJourneyNode(next)) {
    return enterEnding(next, "final_stage");
  }

  if (nextIndex >= next.state.totalNodes) {
    return enterEnding(next, "final_stage");
  }

  next = enterJourneyNode(next, nextIndex);
  next = {
    ...next,
    state: {
      ...next.state,
      nextBattleEnemyHpFactor: 1,
    },
  };

  return next;
}

export function resolveBattleProgression(snapshot: GameSnapshot): GameSnapshot {
  return resolveProgressionAfterBattle(snapshot);
}

export { currentJourneyNode, enterJourneyNode, isFinalJourneyNode };
