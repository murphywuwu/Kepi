import { describe, expect, it } from "vitest";
import { BALANCE } from "@/data";
import {
  endingLetterCount,
  endingSubtitle,
  ENDING_SCENE_COPY,
} from "@/data/letters";
import type { BattleResult, GameSnapshot } from "@/types";
import {
  createInitialSnapshot,
  reduceGameState,
  resetPieceCounter,
} from "../index";
import { enterJourneyNode } from "../journey";
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

const wonBattle: BattleResult = {
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
};

describe("resolveEndingType", () => {
  it("returns storm_rescue when survival is zero", () => {
    expect(
      resolveEndingType({ ...BALANCE.initial, survival: 0 }, "elimination"),
    ).toBe("storm_rescue");
  });

  it("returns perfect_homecoming when kebi meets threshold at final stage", () => {
    expect(
      resolveEndingType(
        { ...BALANCE.initial, kebi: 5, kebiThreshold: 5, survival: 1 },
        "final_stage",
      ),
    ).toBe("perfect_homecoming");
  });

  it("returns regretful_stay when kebi is below threshold at final stage", () => {
    expect(
      resolveEndingType(
        { ...BALANCE.initial, kebi: 3, kebiThreshold: 5, survival: 2 },
        "final_stage",
      ),
    ).toBe("regretful_stay");
  });
});

describe("resolveProgression endings", () => {
  it("enters storm_rescue ending when survival hits zero after a loss", () => {
    const snapshot = baseSnapshot({ survival: 0 });
    const next = resolveProgression({
      ...snapshot,
      phase: "settlement",
      lastBattleResult: {
        ...wonBattle,
        won: false,
        alliesRemaining: 0,
        enemyHpPercent: 50,
        waterGuest: { pieceId: null, deployed: false, survived: false, died: false },
      },
    });

    expect(next.phase).toBe("ending");
    expect(next.state.endingType).toBe("storm_rescue");
  });

  it("enters perfect_homecoming on final journey node with enough kebi", () => {
    const snapshot = enterJourneyNode(
      baseSnapshot({ kebi: 5, kebiThreshold: 5, survival: 2 }),
      6,
    );
    const next = resolveProgression({
      ...snapshot,
      phase: "settlement",
      lastBattleResult: wonBattle,
    });

    expect(next.phase).toBe("ending");
    expect(next.state.endingType).toBe("perfect_homecoming");
  });

  it("enters regretful_stay on final node with insufficient kebi", () => {
    const snapshot = enterJourneyNode(
      baseSnapshot({ kebi: 2, kebiThreshold: 5, survival: 1, pawnedKebi: 1 }),
      6,
    );
    const next = resolveProgression({
      ...snapshot,
      phase: "settlement",
      lastBattleResult: wonBattle,
    });

    expect(next.phase).toBe("ending");
    expect(next.state.endingType).toBe("regretful_stay");
  });
});

describe("ending narrative data", () => {
  const ctx = {
    kebi: 2,
    kebiThreshold: 5,
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
    expect(endingLetterCount("perfect_homecoming", { ...ctx, kebi: 5 })).toBe(3);
    expect(endingLetterCount("regretful_stay", ctx)).toBe(2);
  });

  it("mentions pawned kebi in regret subtitle", () => {
    expect(endingSubtitle("regretful_stay", ctx)).toContain("典当");
  });

  it("uses V3.1 emotional subtitle on perfect ending", () => {
    expect(
      endingSubtitle("perfect_homecoming", { ...ctx, kebi: 5, kebiThreshold: 5 }),
    ).toContain("没能赢下所有的期冀");
  });
});

describe("engine integration — three endings", () => {
  it("final node win with threshold 5 triggers perfect_homecoming", () => {
    resetPieceCounter(0);
    let snapshot = enterJourneyNode(
      {
        ...createInitialSnapshot(),
        board: [],
        phase: "prep",
        state: {
          ...createInitialSnapshot().state,
          kebi: 4,
          kebiThreshold: 5,
        },
      },
      6,
    );

    snapshot = reduceGameState(
      {
        ...snapshot,
        phase: "battle",
        lastBattleResult: wonBattle,
      },
      { type: "END_BATTLE" },
    );
    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });

    expect(snapshot.phase).toBe("ending");
    expect(snapshot.state.endingType).toBe("perfect_homecoming");
    expect(snapshot.state.kebi).toBe(5);
  });
});

describe("gameResultFromEndingType", () => {
  it("maps perfect to win and others to lose", () => {
    expect(gameResultFromEndingType("perfect_homecoming")).toBe("win");
    expect(gameResultFromEndingType("regretful_stay")).toBe("lose");
    expect(gameResultFromEndingType("storm_rescue")).toBe("lose");
  });
});
