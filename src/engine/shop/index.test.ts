import { describe, expect, it, beforeEach } from "vitest";
import type { GameSnapshot } from "@/types";
import { BALANCE, PIECES } from "@/data";
import {
  MAX_POPULATION,
  POPULATION_UPGRADE_COST,
  SHOP_REFRESH_COST,
} from "@/engine/constants";
import {
  buyPiece,
  buyPopulation,
  createPiece,
  mergeMatchingOneStars,
  refreshShop,
  resetPieceCounter,
  rollShop,
  sellPiece,
  sellRefund,
} from "./index";
import { createInitialSnapshot } from "../index";

function prepSnapshot(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    ...createInitialSnapshot(),
    ...overrides,
    state: { ...createInitialSnapshot().state, ...overrides.state },
    shop: {
      ...createInitialSnapshot().shop,
      slots: ["farmer", "guard", "shuike", "xiangxian", "teacher"],
      ...overrides.shop,
    },
  };
}

describe("shop", () => {
  beforeEach(() => {
    resetPieceCounter(0);
  });

  it("creates 2-star pieces with doubled HP/ATK only", () => {
    const shuike = createPiece("shuike", 2);
    expect(shuike.hp).toBe(PIECES.shuike.hp * 2);
    expect(shuike.atk).toBe(PIECES.shuike.atk * 2);
    expect(shuike.atkSpeed).toBe(PIECES.shuike.atkSpeed);
    expect(shuike.armor).toBe(PIECES.shuike.armor);
    expect(shuike.range).toBe(PIECES.shuike.range);

    const xiangxian = createPiece("xiangxian", 2);
    expect(xiangxian.hp).toBe(PIECES.xiangxian.hp * 2);
    expect(xiangxian.atk).toBe(PIECES.xiangxian.atk * 2);
    expect(xiangxian.atkSpeed).toBe(PIECES.xiangxian.atkSpeed);
    expect(xiangxian.armor).toBe(PIECES.xiangxian.armor);
    expect(xiangxian.range).toBe(PIECES.xiangxian.range);
  });

  it("rejects star levels above 2", () => {
    expect(() => createPiece("farmer", 3 as never)).toThrow();
  });

  it("buys shuike and xiangxian from the shop pool", () => {
    let snapshot = prepSnapshot({ state: { ...prepSnapshot().state, gold: 20 } });

    snapshot = buyPiece(snapshot, "shuike");
    expect(snapshot.board).toHaveLength(1);
    expect(snapshot.board[0]?.type).toBe("shuike");
    expect(snapshot.state.gold).toBe(19);

    snapshot = buyPiece(snapshot, "xiangxian");
    expect(snapshot.board).toHaveLength(2);
    expect(snapshot.board[1]?.type).toBe("xiangxian");
    expect(snapshot.state.gold).toBe(17);
  });

  it("refunds 1-star cost and 2-star cost x3 on sell", () => {
    expect(sellRefund(createPiece("guard", 1))).toBe(2);
    expect(sellRefund(createPiece("guard", 2))).toBe(6);

    let snapshot = prepSnapshot({
      board: [createPiece("teacher", 2, "t1")],
      state: { ...prepSnapshot().state, gold: 0 },
    });
    snapshot = sellPiece(snapshot, "t1");
    expect(snapshot.state.gold).toBe(9);
    expect(snapshot.board).toHaveLength(0);
  });

  it("merges three 1-star copies into one 2-star on buy", () => {
    let snapshot = prepSnapshot({
      board: [createPiece("farmer", 1, "f1"), createPiece("farmer", 1, "f2")],
      state: { ...prepSnapshot().state, gold: 10, population: 3 },
    });

    snapshot = buyPiece(snapshot, "farmer");
    expect(snapshot.board).toHaveLength(1);
    expect(snapshot.board[0]?.star).toBe(2);
    expect(snapshot.board[0]?.hp).toBe(PIECES.farmer.hp * 2);
    expect(snapshot.board[0]?.atk).toBe(PIECES.farmer.atk * 2);
  });

  it("allows buying the third copy at population cap because merge frees a slot", () => {
    let snapshot = prepSnapshot({
      board: [
        createPiece("farmer", 1, "f1"),
        createPiece("guard", 1, "g1"),
        createPiece("farmer", 1, "f2"),
      ],
      state: { ...prepSnapshot().state, gold: 10, population: 3 },
    });

    snapshot = buyPiece(snapshot, "farmer");
    expect(snapshot.board).toHaveLength(2);
    expect(snapshot.board.some((piece) => piece.type === "farmer" && piece.star === 2)).toBe(
      true,
    );
  });

  it("does not merge into 3-star", () => {
    const board = [
      createPiece("farmer", 2, "f2a"),
      createPiece("farmer", 2, "f2b"),
      createPiece("farmer", 2, "f2c"),
    ];
    const merged = mergeMatchingOneStars(board, "farmer");
    expect(merged).toHaveLength(3);
    expect(merged.every((piece) => piece.star === 2)).toBe(true);
  });

  it("refreshes shop for refresh cost", () => {
    let snapshot = prepSnapshot({
      state: { ...prepSnapshot().state, gold: 10 },
    });
    const slotsBefore = [...snapshot.shop.slots];

    snapshot = refreshShop(snapshot);
    expect(snapshot.state.gold).toBe(10 - SHOP_REFRESH_COST);
    expect(snapshot.shop.slots).not.toEqual(slotsBefore);
  });

  it("upgrades population up to max for 4 gold", () => {
    let snapshot = prepSnapshot({
      state: { ...prepSnapshot().state, gold: 100, population: 3 },
    });

    snapshot = buyPopulation(snapshot);
    expect(snapshot.state.population).toBe(4);
    expect(snapshot.state.gold).toBe(100 - POPULATION_UPGRADE_COST);

    while (snapshot.state.population < MAX_POPULATION && snapshot.state.gold >= 4) {
      snapshot = buyPopulation(snapshot);
    }
    expect(snapshot.state.population).toBe(MAX_POPULATION);

    const atMax = buyPopulation(snapshot);
    expect(atMax.state.population).toBe(MAX_POPULATION);
  });

  it("rolls shop with shuike and xiangxian in early stages", () => {
    const snapshot = rollShop(createInitialSnapshot());
    const pool = new Set(snapshot.shop.slots);
    expect(pool.has("shuike") || pool.has("xiangxian")).toBe(true);
  });

  it("matches V2 population rules from balance table", () => {
    expect(BALANCE.initial.population).toBe(3);
    expect(BALANCE.population.max).toBe(6);
    expect(BALANCE.population.upgradeCost).toBe(4);
  });
});
