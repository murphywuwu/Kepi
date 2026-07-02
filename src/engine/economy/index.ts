import type { GameSnapshot } from "@/types";
import {
  BLOOD_DEBT_GOLD,
  NODE_WAGE,
  PAWN_KEBI_GOLD,
} from "../constants";
import { syncKebiThreshold } from "../journey";

const PAWN_PHASES = new Set<GameSnapshot["phase"]>(["prep", "pawn_shop"]);

/** V3.1: fixed node wage when advancing the journey. */
export function applyNodeWage(snapshot: GameSnapshot): GameSnapshot {
  const { state } = snapshot;

  return {
    ...snapshot,
    state: {
      ...state,
      gold: state.gold + NODE_WAGE,
    },
  };
}

/** @deprecated Alias for applyNodeWage — kept for tests during migration. */
export const applyRoundIncome = applyNodeWage;

/** Exchange one kebi for immediate gold (prep or pawn_shop). */
export function pawnKebi(snapshot: GameSnapshot): GameSnapshot {
  if (!PAWN_PHASES.has(snapshot.phase)) return snapshot;
  if (snapshot.state.kebi < 1) return snapshot;

  const { state } = snapshot;
  return {
    ...snapshot,
    state: {
      ...state,
      kebi: state.kebi - 1,
      gold: state.gold + PAWN_KEBI_GOLD,
      pawnedKebi: state.pawnedKebi + 1,
      roundPawnCount: state.roundPawnCount + 1,
    },
  };
}

/** Borrow against return — +35 gold, threshold +1 permanently. */
export function borrowAgainstReturn(snapshot: GameSnapshot): GameSnapshot {
  if (!PAWN_PHASES.has(snapshot.phase)) return snapshot;

  const { state } = snapshot;
  const nextState = syncKebiThreshold({
    ...state,
    gold: state.gold + BLOOD_DEBT_GOLD,
    bloodDebtCount: state.bloodDebtCount + 1,
    roundBloodDebt: true,
  });

  return {
    ...snapshot,
    state: nextState,
  };
}
