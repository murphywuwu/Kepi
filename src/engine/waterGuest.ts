import type { BattleEvent, Piece, WaterGuestBattleState } from "@/types";

export function findShuike(allies: Piece[]): Piece | undefined {
  return allies.find((piece) => piece.type === "shuike");
}

export function hasXiangxianPresent(allies: Piece[]): boolean {
  return allies.some((piece) => piece.type === "xiangxian" && piece.hp > 0);
}

/** Snapshot at battle start — was a water guest deployed? */
export function waterGuestAtBattleStart(allies: Piece[]): WaterGuestBattleState {
  const shuike = findShuike(allies);
  if (!shuike) {
    return {
      pieceId: null,
      deployed: false,
      survived: false,
      died: false,
    };
  }

  return {
    pieceId: shuike.id,
    deployed: true,
    survived: shuike.hp > 0,
    died: false,
  };
}

/** Resolve final water guest outcome after combat ends. */
export function finalizeWaterGuestState(
  initial: WaterGuestBattleState,
  allies: Piece[],
): { state: WaterGuestBattleState; events: BattleEvent[] } {
  if (!initial.deployed || !initial.pieceId) {
    return { state: initial, events: [] };
  }

  const shuike = allies.find((piece) => piece.id === initial.pieceId);
  const survived = (shuike?.hp ?? 0) > 0;

  if (survived) {
    return {
      state: {
        ...initial,
        survived: true,
        died: false,
      },
      events: [{ type: "waterGuestSurvived" }],
    };
  }

  return {
    state: {
      ...initial,
      survived: false,
      died: true,
    },
    events: [{ type: "waterGuestDied" }],
  };
}
