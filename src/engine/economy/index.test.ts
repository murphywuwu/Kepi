import { describe, expect, it } from "vitest";
import { BALANCE } from "@/data";
import { createInitialSnapshot, reduceGameState } from "@/engine";
import { applyRoundIncome, pawnKebi } from "./index";

describe("economy (V2.0)", () => {
  it("exposes V2.0 economy constants", () => {
    expect(BALANCE.economy.roundWage).toBe(5);
    expect(BALANCE.economy.shopRefreshCost).toBe(1);
    expect(BALANCE.population.upgradeCost).toBe(4);
    expect(BALANCE.economy.pawnGold).toBe(15);
  });

  it("pays fixed round wage only on win advance", () => {
    let snapshot = createInitialSnapshot();
    const goldBefore = snapshot.state.gold;
    snapshot.state.winStreak = 3;
    snapshot.state.loseStreak = 0;
    snapshot.state.gold = 47;

    snapshot = applyRoundIncome(snapshot);

    expect(snapshot.state.gold).toBe(47 + BALANCE.economy.roundWage);
  });

  it("allows pawn when prep and kebi >= 1", () => {
    let snapshot = createInitialSnapshot();
    snapshot = {
      ...snapshot,
      state: { ...snapshot.state, kebi: 2, gold: 3 },
    };

    const next = pawnKebi(snapshot);

    expect(next.state.kebi).toBe(1);
    expect(next.state.gold).toBe(18);
    expect(next.state.pawnedKebi).toBe(1);
    expect(next.state.roundPawnCount).toBe(1);
  });

  it("rejects pawn when kebi is zero", () => {
    const snapshot = createInitialSnapshot();
    expect(pawnKebi(snapshot)).toBe(snapshot);
  });

  it("rejects pawn outside prep via reducer", () => {
    let snapshot = createInitialSnapshot();
    snapshot = {
      ...snapshot,
      phase: "battle",
      state: { ...snapshot.state, kebi: 2 },
    };

    expect(reduceGameState(snapshot, { type: "PAWN_KEBI" })).toBe(snapshot);
  });

  it("pawn reduces final kebi below threshold and blocks perfect ending", () => {
    let snapshot = createInitialSnapshot();
    snapshot = {
      ...snapshot,
      state: {
        ...snapshot.state,
        stage: 4,
        totalStages: 4,
        kebi: 4,
        kebiThreshold: 4,
        survival: 2,
      },
    };

    snapshot = reduceGameState(snapshot, { type: "PAWN_KEBI" });
    expect(snapshot.state.kebi).toBe(3);

    snapshot = reduceGameState(snapshot, {
      type: "LOAD_SNAPSHOT",
      snapshot: {
        ...snapshot,
        phase: "settlement",
        lastBattleResult: {
          won: true,
          tick: 1,
          elapsedMs: 100,
          events: [{ type: "roundEnd" }],
          alliesRemaining: 1,
          enemiesRemaining: 0,
          allyHpPercent: 100,
          enemyHpPercent: 0,
          waterGuest: {
            pieceId: "shuike_test",
            deployed: true,
            survived: true,
            died: false,
          },
        },
      },
    });

    const ending = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    expect(ending.phase).toBe("ending");
    expect(ending.state.result).toBe("lose");
    expect(ending.state.endingType).toBe("regretful_stay");
    expect(ending.state.kebi).toBe(3);
  });
});
