import type { GameAction, GameSnapshot } from "@/types";
import { BALANCE } from "@/data";
import { defaultAllyPosition } from "@/lib/game/boardLayout";
import {
  advanceBattleTick,
  createBattleSnapshot,
  syncBoardFromBattle,
} from "./battle";
import {
  INITIAL_GOLD,
  INITIAL_POPULATION,
  SNAPSHOT_VERSION,
} from "./constants";
import { applyRoundIncome, pawnKebi } from "./economy";
import {
  applyHomeRepairFromSettlement,
  resolveProgression,
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
  };

  return rollShop(base);
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

    case "START_BATTLE": {
      const board = snapshot.board.map((piece, index) =>
        piece.position ? piece : { ...piece, position: defaultAllyPosition(index) },
      );
      const battle = createBattleSnapshot({
        stage: snapshot.state.stage,
        allies: board,
        homeRepairTier: snapshot.state.homeRepairTier,
      });
      return transitionPhase(
        {
          ...snapshot,
          board,
          battle,
          lastBattleResult: null,
          settlement: null,
        },
        "battle",
      );
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
      const settled = settleStage(
        { ...snapshot, board },
        snapshot.lastBattleResult,
      );
      return transitionPhase(settled, "settlement");
    }

    case "APPLY_HOME_REPAIR":
      return applyHomeRepairFromSettlement(snapshot);

    case "ADVANCE_STAGE": {
      const won = snapshot.lastBattleResult?.won ?? false;
      let next = resolveProgression(snapshot);
      if (next.phase === "ending") {
        return { ...next, battle: null, lastBattleResult: null, settlement: null };
      }
      if (won) {
        next = applyRoundIncome(next);
      }
      next = rollShop(next);
      next = recallBoardToBench(next);
      return transitionPhase(
        {
          ...next,
          battle: null,
          lastBattleResult: null,
          settlement: null,
          state: { ...next.state, roundPawnCount: 0 },
        },
        "prep",
      );
    }

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
export { applyRoundIncome, pawnKebi } from "./economy";
export {
  applyHomeRepairFromSettlement,
  gameResultFromEndingType,
  homeRepairStage,
  resolveEndingType,
  resolveProgression,
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
