import type { GameSnapshot } from "@/types";
import { PAWN_KEBI_GOLD, ROUND_WAGE } from "../constants";

/** V2.0: fixed round wage only — no interest or streak bonuses. */
export function applyRoundIncome(snapshot: GameSnapshot): GameSnapshot {
  const { state } = snapshot;

  return {
    ...snapshot,
    state: {
      ...state,
      gold: state.gold + ROUND_WAGE,
    },
  };
}

/** Prep-only: exchange one kebi for immediate gold. */
export function pawnKebi(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.phase !== "prep") return snapshot;
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
