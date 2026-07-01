import { describe, expect, it } from "vitest";
import { BALANCE } from "@/data";
import {
  endingLetterCount,
  endingSubtitle,
  ENDING_SCENE_COPY,
} from "@/data/letters";
import type { GameSnapshot } from "@/types";
import {
  createInitialSnapshot,
  reduceGameState,
  resetPieceCounter,
} from "../index";
import {
  gameResultFromEndingType,
  resolveEndingType,
  resolveProgression,
} from "./index";

function baseSnapshot(overrides: Partial<GameSnapshot["state"]> = {}): GameSnapshot {
  return {
    ...createInitialSnapshot(),
    state: { ...BALANCE.initial, ...overrides },
  };
}

describe("resolveEndingType", () => {
  it("returns storm_rescue when survival is zero", () => {
    expect(
      resolveEndingType(
        { ...BALANCE.initial, survival: 0 },
        "elimination",
      ),
    ).toBe("storm_rescue");
  });

  it("returns perfect_homecoming when kebi meets threshold at final stage", () => {
    expect(
      resolveEndingType(
        { ...BALANCE.initial, kebi: 4, kebiThreshold: 4, survival: 1 },
        "final_stage",
      ),
    ).toBe("perfect_homecoming");
  });

  it("returns regretful_stay when kebi is below threshold at final stage", () => {
    expect(
      resolveEndingType(
        { ...BALANCE.initial, kebi: 3, kebiThreshold: 4, survival: 2 },
        "final_stage",
      ),
    ).toBe("regretful_stay");
  });
});

describe("gameResultFromEndingType", () => {
  it("maps perfect to win and others to lose", () => {
    expect(gameResultFromEndingType("perfect_homecoming")).toBe("win");
    expect(gameResultFromEndingType("regretful_stay")).toBe("lose");
    expect(gameResultFromEndingType("storm_rescue")).toBe("lose");
  });
});

describe("resolveProgression endings", () => {
  it("enters storm_rescue ending when survival hits zero after a loss", () => {
    const snapshot = baseSnapshot({ survival: 0 });
    const next = resolveProgression({
      ...snapshot,
      phase: "settlement",
      lastBattleResult: {
        won: false,
        tick: 1,
        elapsedMs: 100,
        events: [],
        alliesRemaining: 0,
        enemiesRemaining: 2,
        allyHpPercent: 0,
        enemyHpPercent: 50,
        waterGuest: {
          pieceId: null,
          deployed: false,
          survived: false,
          died: false,
        },
      },
    });

    expect(next.phase).toBe("ending");
    expect(next.state.endingType).toBe("storm_rescue");
    expect(next.state.result).toBe("lose");
  });

  it("enters perfect_homecoming after stage 4 win with enough kebi", () => {
    const snapshot = baseSnapshot({
      stage: 4,
      totalStages: 4,
      kebi: 4,
      survival: 2,
    });
    const next = resolveProgression({
      ...snapshot,
      phase: "settlement",
      lastBattleResult: {
        won: true,
        tick: 1,
        elapsedMs: 100,
        events: [],
        alliesRemaining: 1,
        enemiesRemaining: 0,
        allyHpPercent: 80,
        enemyHpPercent: 0,
        waterGuest: {
          pieceId: "shuike",
          deployed: true,
          survived: true,
          died: false,
        },
      },
    });

    expect(next.phase).toBe("ending");
    expect(next.state.endingType).toBe("perfect_homecoming");
    expect(next.state.result).toBe("win");
  });

  it("enters regretful_stay after stage 4 win with insufficient kebi", () => {
    const snapshot = baseSnapshot({
      stage: 4,
      totalStages: 4,
      kebi: 2,
      survival: 1,
      pawnedKebi: 1,
    });
    const next = resolveProgression({
      ...snapshot,
      phase: "settlement",
      lastBattleResult: {
        won: true,
        tick: 1,
        elapsedMs: 100,
        events: [],
        alliesRemaining: 1,
        enemiesRemaining: 0,
        allyHpPercent: 70,
        enemyHpPercent: 0,
        waterGuest: {
          pieceId: "shuike",
          deployed: true,
          survived: true,
          died: false,
        },
      },
    });

    expect(next.phase).toBe("ending");
    expect(next.state.endingType).toBe("regretful_stay");
    expect(next.state.result).toBe("lose");
  });
});

describe("ending narrative data", () => {
  const ctx = {
    kebi: 2,
    kebiThreshold: 4,
    pawnedKebi: 1,
    homeRepairTier: 2 as const,
    waterGuestSurvived: true,
    waterGuestDied: false,
  };

  it("exposes copy for all three ending types", () => {
    expect(ENDING_SCENE_COPY.perfect_homecoming.badge).toBe("完美归乡");
    expect(ENDING_SCENE_COPY.regretful_stay.badge).toBe("遗憾留守");
    expect(ENDING_SCENE_COPY.storm_rescue.badge).toBe("风浪抢救");
  });

  it("varies letter counts by ending tone", () => {
    expect(endingLetterCount("perfect_homecoming", { ...ctx, kebi: 4 })).toBe(3);
    expect(endingLetterCount("regretful_stay", ctx)).toBe(2);
    expect(
      endingLetterCount("storm_rescue", { ...ctx, kebi: 0, pawnedKebi: 2 }),
    ).toBe(2);
  });

  it("mentions pawned kebi in regret subtitle", () => {
    expect(endingSubtitle("regretful_stay", ctx)).toContain("典当");
  });
});

describe("engine integration — three endings", () => {
  function finishWin(snapshot: GameSnapshot): GameSnapshot {
    const withResult = {
      ...snapshot,
      phase: "battle" as const,
      lastBattleResult: {
        won: true,
        tick: 10,
        elapsedMs: 1000,
        events: [{ type: "roundEnd" as const }],
        alliesRemaining: 1,
        enemiesRemaining: 0,
        allyHpPercent: 80,
        enemyHpPercent: 0,
        waterGuest: {
          pieceId: "shuike_test",
          deployed: true,
          survived: true,
          died: false,
        },
      },
    };
    const settled = reduceGameState(withResult, { type: "END_BATTLE" });
    return reduceGameState(settled, { type: "APPLY_HOME_REPAIR" });
  }

  it("full run to perfect_homecoming", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();

    for (let stage = 1; stage <= 4; stage += 1) {
      snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
      snapshot = finishWin(snapshot);
      snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    }

    expect(snapshot.phase).toBe("ending");
    expect(snapshot.state.endingType).toBe("perfect_homecoming");
    expect(snapshot.state.kebi).toBe(4);
  });
});
