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

function leaveCampfire(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.phase !== "campfire") return snapshot;
  return reduceGameState(snapshot, {
    type: "PICK_CAMPFIRE_CHOICE",
    choiceId: "share-gold",
  });
}

function beginBattle(snapshot: GameSnapshot): GameSnapshot {
  let next = leaveCampfire(snapshot);
  next = reduceGameState(next, { type: "START_BATTLE" });
  return reduceGameState(next, { type: "SKIP_OPENING_BUFF" });
}

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
    expect(ENGINE_VERSION).toBe(3);
  });

  it("initializes V3.1 journey state on campfire opening", () => {
    resetPieceCounter(0);
    const snapshot = createInitialSnapshot();

    expect(snapshot.state).toMatchObject({
      stage: 1,
      totalNodes: 7,
      survival: 2,
      kebiThreshold: 5,
      pawnedKebi: 0,
      bloodDebtCount: 0,
      roundPawnCount: 0,
      homeRepairTier: 0,
      population: 3,
      journeyIndex: 0,
      currentNodeId: "camp-1",
    });
    expect(snapshot.phase).toBe("campfire");
  });

  it("resets roundPawnCount when advancing after a win", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    snapshot = leaveCampfire(snapshot);
    snapshot = {
      ...snapshot,
      state: { ...snapshot.state, kebi: 1, roundPawnCount: 2 },
    };
    snapshot = finishBattle(snapshot, true);
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    expect(snapshot.state.roundPawnCount).toBe(0);
  });

  it("runs prep → opening_buff → battle → settlement → next prep", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    snapshot = leaveCampfire(snapshot);

    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    expect(snapshot.board).toHaveLength(2);

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    expect(snapshot.phase).toBe("opening_buff");

    snapshot = reduceGameState(snapshot, { type: "SKIP_OPENING_BUFF" });
    expect(snapshot.phase).toBe("battle");
    expect(snapshot.battle).not.toBeNull();

    snapshot = finishBattle(snapshot, true);
    expect(snapshot.phase).toBe("settlement");

    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    expect(snapshot.phase).toBe("pawn_shop");
    expect(snapshot.state.journeyIndex).toBe(2);
    expect(snapshot.state.currentNodeId).toBe("pawn-1");
  });

  it("retries same battle node on loss without node wage", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    snapshot = leaveCampfire(snapshot);
    const goldBefore = snapshot.state.gold;

    snapshot = beginBattle(snapshot);
    snapshot = runBattleToCompletion(snapshot);
    expect(snapshot.lastBattleResult?.won).toBe(false);
    expect(snapshot.state.survival).toBe(1);

    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    expect(snapshot.phase).toBe("prep");
    expect(snapshot.state.journeyIndex).toBe(1);
    expect(snapshot.state.gold).toBe(goldBefore);
  });

  it("pays node wage when advancing after a win", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    snapshot = leaveCampfire(snapshot);
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });

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

    expect(snapshot.phase).toBe("pawn_shop");
    expect(snapshot.state.currentNodeId).toBe("pawn-1");
    expect(snapshot.state.gold).toBe(50 + BALANCE.economy.nodeWage);
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
        ...leaveCampfire(createInitialSnapshot()),
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
          enemyHpPercent: 0,
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
    const snapshot = reduceGameState(afterEnd, { type: "APPLY_HOME_REPAIR" });

    expect(snapshot.state.kebi).toBe(1);
    expect(snapshot.state.homeRepair).toBe(30);
    expect(snapshot.settlement?.xiangxianBonusApplied).toBe(true);
  });

  it("does not collect letters or repair home on loss", () => {
    resetPieceCounter(0);
    const snapshot = finishBattle(withShuike(leaveCampfire(createInitialSnapshot())), false);

    expect(snapshot.phase).toBe("settlement");
    expect(snapshot.state.kebi).toBe(0);
    expect(snapshot.state.survival).toBe(1);
  });

  it("win without shuike grants no kebi or repair", () => {
    resetPieceCounter(0);
    const snapshot = finishBattle(leaveCampfire(createInitialSnapshot()), true);
    expect(snapshot.settlement).toMatchObject({
      kebiGained: 0,
      sangziGained: 0,
      homeRepairGained: 0,
    });
  });

  it("initializes a live battle snapshot after opening buff", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(leaveCampfire(createInitialSnapshot()));
    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    snapshot = beginBattle(snapshot);

    expect(snapshot.phase).toBe("battle");
    expect(snapshot.battle?.allies.length).toBeGreaterThan(0);
    expect(snapshot.battle?.enemies.length).toBeGreaterThan(0);
  });

  it("enters storm ending when survival reaches zero", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(leaveCampfire(createInitialSnapshot()));

    for (let round = 0; round < 2; round += 1) {
      snapshot = beginBattle(snapshot);
      snapshot = runBattleToCompletion(snapshot);
      if (snapshot.phase === "ending") break;
      snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    }

    expect(snapshot.phase).toBe("ending");
    expect(snapshot.state.endingType).toBe("storm_rescue");
  });

  it("enters perfect ending on final node when kebi meets threshold", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(createInitialSnapshot());
    snapshot = {
      ...snapshot,
      state: {
        ...snapshot.state,
        journeyIndex: 6,
        currentNodeId: "battle-7",
        stage: 7,
        kebi: 5,
        kebiThreshold: 5,
      },
      phase: "prep",
    };

    snapshot = finishBattle(snapshot, true);
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });

    expect(snapshot.phase).toBe("ending");
    expect(snapshot.state.endingType).toBe("perfect_homecoming");
  });

  it("tracks win and lose streaks without paying node wage on loss", () => {
    resetPieceCounter(0);
    let snapshot = withShuike(leaveCampfire(createInitialSnapshot()));

    snapshot = finishBattle(snapshot, true);
    expect(snapshot.state.winStreak).toBe(1);
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    const goldAfterWin = snapshot.state.gold;

    snapshot = {
      ...snapshot,
      phase: "prep" as const,
      state: {
        ...snapshot.state,
        journeyIndex: 3,
        currentNodeId: "battle-3",
        stage: 3,
      },
    };
    snapshot = beginBattle(snapshot);
    snapshot = runBattleToCompletion(snapshot);
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });

    expect(snapshot.state.winStreak).toBe(0);
    expect(snapshot.state.loseStreak).toBe(1);
    expect(snapshot.state.gold).toBe(goldAfterWin);
  });
});
