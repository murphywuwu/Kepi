import { describe, expect, it } from "vitest";
import {
  letterStripNeedsHint,
  letterStripNarrative,
} from "./letterNarrative";
import type { Piece } from "@/types";
import { createPiece } from "@/engine/shop";

function testPiece(type: "shuike" | "xiangxian", id: string, position: Piece["position"]): Piece {
  const piece = createPiece(type);
  return { ...piece, id, position };
}

const shuikePlaced: Piece = testPiece("shuike", "shuike-1", { x: 2, y: 0 });
const shuikeBench: Piece = testPiece("shuike", "shuike-2", null);
const xiangxianPlaced: Piece = testPiece("xiangxian", "xx-1", { x: 1, y: 0 });

describe("letterStripNeedsHint", () => {
  it("flags missing water guest", () => {
    expect(
      letterStripNeedsHint({
        stage: 1,
        journeyIndex: 0,
        board: [],
        shuikeOnBoard: [],
        xiangxianOnBoard: [],
      }),
    ).toBe(true);
  });

  it("flags first battle prep even when water guest is placed", () => {
    expect(
      letterStripNeedsHint({
        stage: 1,
        journeyIndex: 1,
        board: [shuikePlaced],
        shuikeOnBoard: [shuikePlaced],
        xiangxianOnBoard: [],
      }),
    ).toBe(true);
  });

  it("flags unplaced water guest", () => {
    expect(
      letterStripNeedsHint({
        stage: 1,
        journeyIndex: 0,
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
        journeyIndex: 5,
        board: [shuikePlaced],
        shuikeOnBoard: [shuikePlaced],
        xiangxianOnBoard: [xiangxianPlaced],
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
        journeyIndex: 0,
        currentNodeId: "battle-1",
        nextBattleEnemyHpFactor: 1,
        kebi: 0,
        kebiThreshold: 5,
        board: [],
        shuikeOnBoard: [],
        xiangxianOnBoard: [],
        winStreak: 0,
        loseStreak: 0,
      }),
    ).toContain("水客未上场");
  });

  it("uses first-battle tutorial copy on battle-2 prep", () => {
    expect(
      letterStripNarrative({
        phase: "prep",
        stage: 2,
        journeyIndex: 1,
        currentNodeId: "battle-2",
        nextBattleEnemyHpFactor: 1,
        kebi: 0,
        kebiThreshold: 5,
        board: [],
        shuikeOnBoard: [],
        xiangxianOnBoard: [],
        winStreak: 0,
        loseStreak: 0,
      }),
    ).toContain("海禁余波");
  });

  it("describes settlement win without letter", () => {
    expect(
      letterStripNarrative({
        phase: "settlement",
        stage: 2,
        journeyIndex: 2,
        currentNodeId: "battle-2",
        nextBattleEnemyHpFactor: 1,
        kebi: 0,
        kebiThreshold: 5,
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
          kebiGained: 0,
          sangziConsumed: 0,
          homeRepairBefore: 0,
          homeRepairGained: 0,
          homeRepairAfter: 0,
          survivalLost: 0,
          xiangxianBonusApplied: false,
          homeRepairMilestone: null,
        },
      }),
    ).toContain("信没到");
  });

  it("uses battle-3 prep copy for 关隘盘查", () => {
    expect(
      letterStripNarrative({
        phase: "prep",
        stage: 3,
        journeyIndex: 3,
        currentNodeId: "battle-3",
        nextBattleEnemyHpFactor: 1,
        kebi: 0,
        kebiThreshold: 5,
        board: [],
        shuikeOnBoard: [],
        xiangxianOnBoard: [],
        winStreak: 0,
        loseStreak: 0,
      }),
    ).toContain("关隘");
  });

  it("uses battle-4 prep copy for 契约束缚", () => {
    expect(
      letterStripNarrative({
        phase: "prep",
        stage: 4,
        journeyIndex: 5,
        currentNodeId: "battle-4",
        nextBattleEnemyHpFactor: 0.9,
        kebi: 2,
        kebiThreshold: 5,
        board: [],
        shuikeOnBoard: [{ ...shuikePlaced }],
        xiangxianOnBoard: [xiangxianPlaced],
        winStreak: 0,
        loseStreak: 0,
      }),
    ).toContain("夜话减益");
  });

  it("uses battle-7 prep copy for 风浪归乡", () => {
    expect(
      letterStripNarrative({
        phase: "prep",
        stage: 7,
        journeyIndex: 6,
        currentNodeId: "battle-7",
        nextBattleEnemyHpFactor: 1,
        kebi: 5,
        kebiThreshold: 5,
        board: [shuikePlaced],
        shuikeOnBoard: [shuikePlaced],
        xiangxianOnBoard: [],
        winStreak: 0,
        loseStreak: 0,
      }),
    ).toContain("围住水客");
  });

  it("warns on battle-7 settlement when kebi short", () => {
    expect(
      letterStripNarrative({
        phase: "settlement",
        stage: 7,
        journeyIndex: 6,
        currentNodeId: "battle-7",
        nextBattleEnemyHpFactor: 1,
        kebi: 3,
        kebiThreshold: 5,
        board: [],
        shuikeOnBoard: [],
        xiangxianOnBoard: [],
        winStreak: 0,
        loseStreak: 0,
        settlement: {
          won: true,
          waterGuestDeployed: true,
          waterGuestSurvived: true,
          waterGuestDied: false,
          sangziGained: 1,
          sangziConsumed: 1,
          homeRepairBefore: 0,
          homeRepairGained: 0,
          homeRepairAfter: 0,
          survivalLost: 0,
          xiangxianBonusApplied: false,
          kebiGained: 1,
          homeRepairMilestone: null,
        },
      }),
    ).toContain("终局已过");
  });
});
