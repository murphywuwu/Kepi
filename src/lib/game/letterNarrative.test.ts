import { describe, expect, it } from "vitest";
import {
  letterStripNeedsHint,
  letterStripNarrative,
} from "./letterNarrative";
import type { Piece } from "@/types";

const shuikePlaced: Piece = {
  id: "shuike-1",
  type: "shuike",
  star: 1,
  position: { x: 2, y: 0 },
};

const shuikeBench: Piece = {
  id: "shuike-2",
  type: "shuike",
  star: 1,
  position: null,
};

describe("letterStripNeedsHint", () => {
  it("flags missing water guest", () => {
    expect(
      letterStripNeedsHint({
        stage: 1,
        board: [],
        shuikeOnBoard: [],
        xiangxianOnBoard: [],
      }),
    ).toBe(true);
  });

  it("flags unplaced water guest", () => {
    expect(
      letterStripNeedsHint({
        stage: 1,
        board: [shuikeBench],
        shuikeOnBoard: [shuikeBench],
        xiangxianOnBoard: [],
      }),
    ).toBe(true);
  });

  it("flags late-game assassin prep", () => {
    expect(
      letterStripNeedsHint({
        stage: 4,
        board: [shuikePlaced],
        shuikeOnBoard: [shuikePlaced],
        xiangxianOnBoard: [{ ...shuikePlaced, id: "xx-1", type: "xiangxian" }],
      }),
    ).toBe(true);
  });
});

describe("letterStripNarrative", () => {
  it("warns when water guest is missing", () => {
    expect(
      letterStripNarrative({
        phase: "prep",
        stage: 1,
        board: [],
        shuikeOnBoard: [],
        xiangxianOnBoard: [],
        winStreak: 0,
        loseStreak: 0,
      }),
    ).toContain("水客未上场");
  });

  it("describes settlement win without letter", () => {
    expect(
      letterStripNarrative({
        phase: "settlement",
        stage: 2,
        board: [],
        shuikeOnBoard: [],
        xiangxianOnBoard: [],
        winStreak: 0,
        loseStreak: 0,
        settlement: {
          won: true,
          waterGuestDeployed: false,
          waterGuestSurvived: false,
          waterGuestDied: false,
          sangziGained: 0,
          sangziConsumed: false,
          xiangxianBonusApplied: false,
        },
      }),
    ).toContain("水客未上场");
  });
});
