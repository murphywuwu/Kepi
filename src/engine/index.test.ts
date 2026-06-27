import { describe, expect, it } from "vitest";
import type { BattleResult, GameSnapshot } from "@/types";
import {
  createInitialSnapshot,
  reduceGameState,
  resetPieceCounter,
  ENGINE_VERSION,
} from "./index";

function finishBattle(snapshot: GameSnapshot, won: boolean): GameSnapshot {
  const result: BattleResult = {
    won,
    tick: 10,
    elapsedMs: 1000,
    events: [{ type: "roundEnd" }],
    alliesRemaining: won ? 1 : 0,
    enemiesRemaining: won ? 0 : 2,
    allyHpPercent: won ? 80 : 0,
    enemyHpPercent: won ? 0 : 60,
  };
  return reduceGameState(
    { ...snapshot, phase: "battle", lastBattleResult: result },
    { type: "END_BATTLE" },
  );
}

describe("engine", () => {
  it("exports snapshot version", () => {
    expect(ENGINE_VERSION).toBe(1);
  });

  it("runs prep → battle → settlement → next prep loop", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();

    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    expect(snapshot.board).toHaveLength(1);

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    expect(snapshot.phase).toBe("battle");
    expect(snapshot.lastBattleResult).not.toBeNull();

    snapshot = finishBattle(snapshot, true);
    expect(snapshot.phase).toBe("settlement");

    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    expect(snapshot.phase).toBe("prep");
    expect(snapshot.state.stage).toBe(2);
  });

  it("retries same stage on loss without round income", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();
    const goldBefore = snapshot.state.gold;

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    expect(snapshot.lastBattleResult?.won).toBe(false);
    snapshot = reduceGameState(snapshot, { type: "END_BATTLE" });
    expect(snapshot.state.survival).toBe(1);

    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    expect(snapshot.phase).toBe("prep");
    expect(snapshot.state.stage).toBe(1);
    expect(snapshot.state.gold).toBe(goldBefore);
  });

  it("advances stage and pays round income on win", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    const goldAfterBuy = snapshot.state.gold;

    snapshot = finishBattle(snapshot, true);
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });

    expect(snapshot.phase).toBe("prep");
    expect(snapshot.state.stage).toBe(2);
    expect(snapshot.state.gold).toBeGreaterThan(goldAfterBuy);
  });

  it("recalls placed pieces to bench when advancing to next prep", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    const pieceId = snapshot.board[0]!.id;
    snapshot = reduceGameState(snapshot, {
      type: "MOVE_PIECE",
      pieceId,
      position: { x: 3, y: 4 },
    });
    expect(snapshot.board[0]?.position).toEqual({ x: 3, y: 4 });

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    snapshot = finishBattle(snapshot, true);
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });

    expect(snapshot.phase).toBe("prep");
    expect(snapshot.board[0]?.position).toBeNull();
  });

  it("ends game when survival reaches zero", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();

    for (let round = 0; round < 2; round += 1) {
      snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
      snapshot = reduceGameState(snapshot, { type: "END_BATTLE" });
      if (snapshot.phase === "ending") break;
      snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    }

    expect(snapshot.phase).toBe("ending");
    expect(snapshot.state.result).toBe("lose");
  });
});
