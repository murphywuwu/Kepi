import { describe, expect, it } from "vitest";
import { BALANCE } from "@/data";
import type { BattleResult, GameSnapshot, Piece } from "@/types";
import { createPiece } from "./shop";
import {
  createInitialSnapshot,
  reduceGameState,
  resetPieceCounter,
  ENGINE_VERSION,
} from "./index";

function withShuike(snapshot: GameSnapshot): GameSnapshot {
  const shuike = createPiece("shuike");
  shuike.position = { x: 4, y: 5 };
  return { ...snapshot, board: [...snapshot.board, shuike] };
}

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
    waterGuest: {
      pieceId: snapshot.board.find((p) => p.type === "shuike")?.id ?? null,
      deployed: snapshot.board.some((p) => p.type === "shuike"),
      survived: won && snapshot.board.some((p) => p.type === "shuike"),
      died: !won && snapshot.board.some((p) => p.type === "shuike"),
    },
  };
  const settled = reduceGameState(
    { ...snapshot, phase: "battle", lastBattleResult: result },
    { type: "END_BATTLE" },
  );
  if (!won) return settled;
  return reduceGameState(settled, { type: "APPLY_HOME_REPAIR" });
}

function runBattleToCompletion(snapshot: GameSnapshot): GameSnapshot {
  let next = snapshot;
  while (next.phase === "battle" && next.battle && !next.battle.finished) {
    next = reduceGameState(next, { type: "BATTLE_TICK" });
  }
  return reduceGameState(next, { type: "END_BATTLE" });
}

describe("engine", () => {
  it("exports snapshot version", () => {
    expect(ENGINE_VERSION).toBe(2);
  });

  it("initializes V2.0 micro-run state", () => {
    resetPieceCounter(0);
    const snapshot = createInitialSnapshot();

    expect(snapshot.state).toMatchObject({
      stage: 1,
      totalStages: 4,
      survival: 2,
      kebiThreshold: 4,
      pawnedKebi: 0,
      roundPawnCount: 0,
      homeRepairTier: 0,
      population: 3,
    });
  });

  it("resets roundPawnCount when advancing to next prep", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();
    snapshot = {
      ...snapshot,
      state: { ...snapshot.state, kebi: 1, roundPawnCount: 2 },
    };
    snapshot = finishBattle(withShuike(snapshot), true);
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    expect(snapshot.state.roundPawnCount).toBe(0);
  });

  it("runs prep → battle → settlement → next prep loop", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());

    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    expect(snapshot.board).toHaveLength(2);

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    expect(snapshot.phase).toBe("battle");
    expect(snapshot.battle).not.toBeNull();
    expect(snapshot.battle?.tulouBuffs.tier).toBe(0);
    expect(snapshot.lastBattleResult).toBeNull();

    snapshot = finishBattle(snapshot, true);
    expect(snapshot.phase).toBe("settlement");

    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    expect(snapshot.phase).toBe("prep");
    expect(snapshot.state.stage).toBe(2);
  });

  it("retries same stage on loss without round income", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    const goldBefore = snapshot.state.gold;

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    snapshot = runBattleToCompletion(snapshot);
    expect(snapshot.lastBattleResult?.won).toBe(false);
    expect(snapshot.state.survival).toBe(1);

    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    expect(snapshot.phase).toBe("prep");
    expect(snapshot.state.stage).toBe(1);
    expect(snapshot.state.gold).toBe(goldBefore);
  });

  it("advances stage and pays fixed round wage on win (no interest or streak bonus)", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    const goldAfterBuy = snapshot.state.gold;

    snapshot = {
      ...snapshot,
      state: {
        ...snapshot.state,
        gold: 50,
        winStreak: 4,
        loseStreak: 0,
      },
    };

    snapshot = finishBattle(snapshot, true);
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });

    expect(snapshot.phase).toBe("prep");
    expect(snapshot.state.stage).toBe(2);
    expect(snapshot.state.gold).toBe(50 + BALANCE.economy.roundWage);
  });

  it("settles a won stage as shuike collection followed by xiangxian repair", () => {
    resetPieceCounter(0);
    let board: Piece[] = [];
    const shuike = createPiece("shuike");
    shuike.position = { x: 4, y: 5 };
    board = [shuike];
    const xiangxian = createPiece("xiangxian");
    xiangxian.position = { x: 3, y: 5 };
    board = [...board, xiangxian];

    const afterEnd = reduceGameState(
      {
        ...createInitialSnapshot(),
        board,
        phase: "battle",
        lastBattleResult: {
          won: true,
          tick: 10,
          elapsedMs: 1000,
          events: [{ type: "roundEnd" }],
          alliesRemaining: 2,
          enemiesRemaining: 0,
          allyHpPercent: 80,
          waterGuest: {
            pieceId: shuike.id,
            deployed: true,
            survived: true,
            died: false,
          },
        },
      },
      { type: "END_BATTLE" },
    );

    expect(afterEnd.phase).toBe("settlement");
    expect(afterEnd.state.homeRepair).toBe(0);

    const snapshot = reduceGameState(afterEnd, { type: "APPLY_HOME_REPAIR" });

    expect(snapshot.state.kebi).toBe(1);
    expect(snapshot.state.sangzi).toBe(0);
    expect(snapshot.state.homeRepair).toBe(30);
    expect(snapshot.state.homeRepairTier).toBe(0);
    expect(snapshot.settlement).toMatchObject({
      won: true,
      kebiGained: 1,
      sangziGained: 20,
      sangziConsumed: 20,
      homeRepairBefore: 0,
      homeRepairGained: 30,
      homeRepairAfter: 30,
      survivalLost: 0,
      xiangxianBonusApplied: true,
      homeRepairMilestone: null,
    });
  });

  it("reports homeRepairMilestone when crossing 33%", () => {
    resetPieceCounter(0);
    const shuike = createPiece("shuike");
    const afterEnd = reduceGameState(
      {
        ...createInitialSnapshot(),
        board: [shuike],
        state: { ...createInitialSnapshot().state, homeRepair: 20 },
        phase: "battle",
        lastBattleResult: {
          won: true,
          tick: 10,
          elapsedMs: 1000,
          events: [{ type: "roundEnd" }],
          alliesRemaining: 1,
          enemiesRemaining: 0,
          allyHpPercent: 80,
          waterGuest: {
            pieceId: shuike.id,
            deployed: true,
            survived: true,
            died: false,
          },
        },
      },
      { type: "END_BATTLE" },
    );

    expect(afterEnd.settlement?.homeRepairMilestone).toBe(33);
    expect(afterEnd.settlement?.homeRepairAfter).toBe(40);
  });

  it("repairs the tulou by 20% per win without xiangxian", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    const repairs: number[] = [snapshot.state.homeRepair];

    for (let round = 0; round < 4; round += 1) {
      snapshot = finishBattle(snapshot, true);
      repairs.push(snapshot.state.homeRepair);
      if (round < 3) {
        snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
      }
    }

    expect(repairs).toEqual([0, 20, 40, 60, 80]);
  });

  it("does not collect letters or repair home on loss", () => {
    resetPieceCounter(0);
    const snapshot = finishBattle(withShuike(createInitialSnapshot()), false);

    expect(snapshot.phase).toBe("settlement");
    expect(snapshot.state.kebi).toBe(0);
    expect(snapshot.state.sangzi).toBe(0);
    expect(snapshot.state.homeRepair).toBe(0);
    expect(snapshot.state.survival).toBe(1);
    expect(snapshot.settlement).toMatchObject({
      won: false,
      kebiGained: 0,
      sangziGained: 0,
      sangziConsumed: 0,
      homeRepairGained: 0,
      survivalLost: 1,
    });
  });

  it("win without shuike grants no kebi or repair", () => {
    resetPieceCounter(0);
    const snapshot = finishBattle(createInitialSnapshot(), true);
    expect(snapshot.settlement).toMatchObject({
      kebiGained: 0,
      sangziGained: 0,
      homeRepairGained: 0,
    });
  });

  it("recalls placed pieces to bench when advancing to next prep", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    const pieceId = snapshot.board.find((p) => p.type === "farmer")!.id;
    snapshot = reduceGameState(snapshot, {
      type: "MOVE_PIECE",
      pieceId,
      position: { x: 3, y: 4 },
    });
    expect(snapshot.board.find((p) => p.id === pieceId)?.position).toEqual({
      x: 3,
      y: 4,
    });

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    snapshot = finishBattle(snapshot, true);
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });

    expect(snapshot.phase).toBe("prep");
    expect(snapshot.board.find((p) => p.id === pieceId)?.position).toBeNull();
  });

  it("initializes a live battle snapshot on START_BATTLE", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });

    expect(snapshot.phase).toBe("battle");
    expect(snapshot.battle).not.toBeNull();
    expect(snapshot.battle?.finished).toBe(false);
    expect(snapshot.battle?.tick).toBe(0);
    expect(snapshot.lastBattleResult).toBeNull();
    expect(snapshot.battle?.allies.length).toBeGreaterThan(0);
    expect(snapshot.battle?.enemies.length).toBeGreaterThan(0);
  });

  it("ends game when survival reaches zero", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });

    for (let round = 0; round < 2; round += 1) {
      snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
      snapshot = runBattleToCompletion(snapshot);
      if (snapshot.phase === "ending") break;
      snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    }

    expect(snapshot.phase).toBe("ending");
    expect(snapshot.state.result).toBe("lose");
    expect(snapshot.state.endingType).toBe("storm_rescue");
  });

  it("enters win ending after stage 4 when kebi meets threshold", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });

    for (let stage = 1; stage <= 4; stage += 1) {
      snapshot = finishBattle(snapshot, true);
      if (stage < 4) {
        snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
      } else {
        snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
      }
    }

    expect(snapshot.phase).toBe("ending");
    expect(snapshot.state.stage).toBe(4);
    expect(snapshot.state.kebi).toBe(4);
    expect(snapshot.state.result).toBe("win");
    expect(snapshot.state.endingType).toBe("perfect_homecoming");
  });

  it("enters regret ending after stage 4 when kebi stays below threshold", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });

    for (let stage = 1; stage < 4; stage += 1) {
      snapshot = finishBattle(snapshot, true);
      snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    }

    snapshot = finishBattle(
      { ...snapshot, state: { ...snapshot.state, stage: 4, kebi: 2 } },
      true,
    );
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });

    expect(snapshot.phase).toBe("ending");
    expect(snapshot.state.kebi).toBe(3);
    expect(snapshot.state.result).toBe("lose");
    expect(snapshot.state.endingType).toBe("regretful_stay");
  });

  it("tracks win and lose streaks for display without affecting income", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });

    snapshot = finishBattle(snapshot, true);
    expect(snapshot.state.winStreak).toBe(1);
    expect(snapshot.state.loseStreak).toBe(0);

    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    const goldAfterWin = snapshot.state.gold;

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    snapshot = runBattleToCompletion(snapshot);
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });

    expect(snapshot.state.winStreak).toBe(0);
    expect(snapshot.state.loseStreak).toBe(1);
    expect(snapshot.state.gold).toBe(goldAfterWin);
  });
});
