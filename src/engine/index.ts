import type { GameAction, GameSnapshot } from "@/types";
import { BALANCE } from "@/data";
import { advanceBattleTick, syncBoardFromBattle } from "./battle";
import { SNAPSHOT_VERSION } from "./constants";
import { borrowAgainstReturn, pawnKebi } from "./economy";
import { advanceJourney, applyCampfireChoice, leavePawnShop } from "./journey/advance";
import { startJourney } from "./journey";
import {
  beginOpeningBuffPhase,
  catchOpeningBuff,
  enterBattleFromOpeningBuff,
  skipOpeningBuff,
} from "./openingBuff";
import {
  applyHomeRepairFromSettlement,
  resolveProgressionAfterBattle,
  settleStage,
} from "./progression";
import {
  buyPiece,
  buyPopulation,
  movePiece,
  refreshShop,
  rollShop,
  recallBoardToBench,
  sellPiece,
} from "./shop";
import { canApplyAction, cloneSnapshot, transitionPhase } from "./stateMachine";

export const ENGINE_VERSION = SNAPSHOT_VERSION;

function clearBattleFields(snapshot: GameSnapshot): GameSnapshot {
  return {
    ...snapshot,
    battle: null,
    lastBattleResult: null,
    settlement: null,
    openingBuff: null,
    activeOpeningBuff: null,
  };
}

function afterJourneyAdvance(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.phase === "ending") {
    return clearBattleFields(snapshot);
  }
  if (snapshot.phase === "prep") {
    return recallBoardToBench(rollShop(snapshot));
  }
  return snapshot;
}

export function createInitialSnapshot(): GameSnapshot {
  const base: GameSnapshot = {
    version: SNAPSHOT_VERSION,
    phase: "prep",
    state: { ...BALANCE.initial },
    board: [],
    shop: {
      slots: [],
      refreshCost: BALANCE.economy.shopRefreshCost,
    },
    battle: null,
    lastBattleResult: null,
    settlement: null,
    openingBuff: null,
    activeOpeningBuff: null,
    campfire: null,
  };

  return startJourney(rollShop(base));
}

export function reduceGameState(
  snapshot: GameSnapshot,
  action: GameAction,
): GameSnapshot {
  if (!canApplyAction(snapshot, action) && action.type !== "LOAD_SNAPSHOT") {
    return snapshot;
  }

  switch (action.type) {
    case "LOAD_SNAPSHOT":
      return cloneSnapshot(action.snapshot);

    case "BUY_PIECE":
      return buyPiece(snapshot, action.pieceType);

    case "SELL_PIECE":
      return sellPiece(snapshot, action.pieceId);

    case "MOVE_PIECE":
      return movePiece(snapshot, action.pieceId, action.position);

    case "REFRESH_SHOP":
      return refreshShop(snapshot);

    case "BUY_POPULATION":
      return buyPopulation(snapshot);

    case "PAWN_KEBI":
      return pawnKebi(snapshot);

    case "BORROW_AGAINST_RETURN":
      return borrowAgainstReturn(snapshot);

    case "START_BATTLE":
      return beginOpeningBuffPhase(snapshot);

    case "CATCH_OPENING_BUFF": {
      const caught = catchOpeningBuff(snapshot);
      return enterBattleFromOpeningBuff(caught);
    }

    case "SKIP_OPENING_BUFF": {
      const skipped = skipOpeningBuff(snapshot);
      return enterBattleFromOpeningBuff(skipped);
    }

    case "BATTLE_TICK": {
      if (!snapshot.battle || snapshot.battle.finished) {
        return snapshot;
      }
      const step = advanceBattleTick(snapshot.battle);
      return {
        ...snapshot,
        battle: step.battle,
        lastBattleResult: step.result ?? snapshot.lastBattleResult,
      };
    }

    case "END_BATTLE": {
      if (!snapshot.lastBattleResult) {
        return transitionPhase(snapshot, "settlement");
      }
      const board = syncBoardFromBattle(snapshot.board, snapshot.battle);
      const settled = settleStage({ ...snapshot, board }, snapshot.lastBattleResult);
      return transitionPhase(settled, "settlement");
    }

    case "APPLY_HOME_REPAIR":
      return applyHomeRepairFromSettlement(snapshot);

    case "ADVANCE_STAGE":
    case "ADVANCE_JOURNEY": {
      let next = resolveProgressionAfterBattle(snapshot);
      if (next.phase === "ending") {
        return clearBattleFields(next);
      }

      const won = snapshot.lastBattleResult?.won ?? false;
      if (won) {
        next = advanceJourney(next);
      } else {
        next = recallBoardToBench(rollShop(clearBattleFields(next)));
        next = transitionPhase(
          {
            ...next,
            state: { ...next.state, roundPawnCount: 0, roundBloodDebt: false },
          },
          "prep",
        );
      }

      return afterJourneyAdvance(next);
    }

    case "LEAVE_PAWN_SHOP":
      return afterJourneyAdvance(leavePawnShop(snapshot));

    case "PICK_CAMPFIRE_CHOICE":
      return afterJourneyAdvance(applyCampfireChoice(snapshot, action.choiceId));

    default:
      return snapshot;
  }
}

export {
  advanceBattleTick,
  applyAssassinLeap,
  calcDamage,
  createBattleSnapshot,
  enemyTypesForStage,
  hakkaAtkMultiplier,
  simulateBattle,
  spawnEnemiesForStage,
  syncBoardFromBattle,
} from "./battle";
export {
  applyNodeWage,
  applyRoundIncome,
  borrowAgainstReturn,
  pawnKebi,
} from "./economy";
export {
  advanceJourney,
  applyCampfireChoice,
  leavePawnShop,
} from "./journey/advance";
export {
  computeKebiThreshold,
  currentJourneyNode,
  enterJourneyNode,
  isFinalJourneyNode,
  startJourney,
  syncKebiThreshold,
} from "./journey";
export {
  applyHomeRepairFromSettlement,
  gameResultFromEndingType,
  homeRepairStage,
  resolveEndingType,
  resolveProgression,
  resolveProgressionAfterBattle,
  settleStage,
} from "./progression";
export {
  buyPiece,
  buyPopulation,
  createPiece,
  mergeMatchingOneStars,
  movePiece,
  refreshShop,
  rollShop,
  recallBoardToBench,
  resetPieceCounter,
  sellPiece,
  sellRefund,
} from "./shop";
export { canApplyAction, cloneSnapshot, transitionPhase } from "./stateMachine";
