import { describe, expect, it } from "vitest";
import {
  hasShuikeOnBoard,
  isShuikePlacedOnBackRow,
  nextPrepGuideStepFromBoard,
  resolvePrepGuideStep,
} from "./prepGuide";
import type { Piece } from "@/types";

const shuikeBench: Piece = {
  id: "shuike-1",
  type: "shuike",
  cost: 1,
  star: 1,
  position: null,
  hp: 100,
  maxHp: 100,
  atk: 5,
  atkSpeed: 1,
  armor: 0,
  range: "ranged",
  clan: "hakka",
};

const shuikeBack: Piece = {
  ...shuikeBench,
  position: { x: 3, y: 3 },
};

describe("prepGuide", () => {
  it("advances from buy to place when shuike is recruited", () => {
    expect(nextPrepGuideStepFromBoard(1, [shuikeBench])).toBe(2);
  });

  it("advances from place to start when shuike is on back row", () => {
    expect(nextPrepGuideStepFromBoard(2, [shuikeBack])).toBe(3);
  });

  it("resolves initial guide step from board when entering battle-2", () => {
    expect(resolvePrepGuideStep([])).toBe(1);
    expect(resolvePrepGuideStep([shuikeBench])).toBe(2);
    expect(resolvePrepGuideStep([shuikeBack])).toBe(3);
  });

  it("detects shuike placement on back row", () => {
    expect(hasShuikeOnBoard([shuikeBench])).toBe(true);
    expect(isShuikePlacedOnBackRow([shuikeBack])).toBe(true);
    expect(isShuikePlacedOnBackRow([{ ...shuikeBack, position: { x: 3, y: 4 } }])).toBe(
      false,
    );
  });
});
