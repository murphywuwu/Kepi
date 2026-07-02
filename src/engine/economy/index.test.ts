import { describe, expect, it } from "vitest";
import { BALANCE } from "@/data";
import { createInitialSnapshot, reduceGameState } from "@/engine";
import { applyNodeWage, borrowAgainstReturn, pawnKebi } from "./index";

describe("economy (V3.1)", () => {
  it("exposes V3.1 economy constants", () => {
    expect(BALANCE.economy.nodeWage).toBe(5);
    expect(BALANCE.economy.shopRefreshCost).toBe(1);
    expect(BALANCE.population.upgradeCost).toBe(4);
    expect(BALANCE.economy.pawnGold).toBe(15);
    expect(BALANCE.economy.bloodDebtGold).toBe(35);
    expect(BALANCE.journey.baseKebiThreshold).toBe(5);
  });

  it("pays fixed node wage on advance", () => {
    let snapshot = createInitialSnapshot();
    snapshot = {
      ...snapshot,
      state: { ...snapshot.state, gold: 47 },
    };

    snapshot = applyNodeWage(snapshot);

    expect(snapshot.state.gold).toBe(52);
  });

  it("allows pawn when prep and kebi >= 1", () => {
    let snapshot = createInitialSnapshot();
    snapshot = {
      ...snapshot,
      phase: "prep",
      state: { ...snapshot.state, kebi: 2, gold: 3 },
    };

    const next = pawnKebi(snapshot);

    expect(next.state.kebi).toBe(1);
    expect(next.state.gold).toBe(18);
    expect(next.state.pawnedKebi).toBe(1);
  });

  it("allows blood debt even at zero kebi and raises threshold", () => {
    let snapshot = createInitialSnapshot();
    snapshot = {
      ...snapshot,
      phase: "prep",
      state: { ...snapshot.state, kebi: 0, gold: 0, kebiThreshold: 5 },
    };

    const next = borrowAgainstReturn(snapshot);

    expect(next.state.gold).toBe(35);
    expect(next.state.bloodDebtCount).toBe(1);
    expect(next.state.kebiThreshold).toBe(6);
    expect(next.state.roundBloodDebt).toBe(true);
  });

  it("rejects pawn outside allowed phases via reducer", () => {
    let snapshot = createInitialSnapshot();
    snapshot = {
      ...snapshot,
      phase: "battle",
      state: { ...snapshot.state, kebi: 2 },
    };

    expect(reduceGameState(snapshot, { type: "PAWN_KEBI" })).toBe(snapshot);
  });

  it("blood debt stacks threshold for ending gate", () => {
    let snapshot = createInitialSnapshot();
    snapshot = {
      ...snapshot,
      phase: "prep",
      state: {
        ...snapshot.state,
        kebi: 6,
        kebiThreshold: 5,
        bloodDebtCount: 0,
      },
    };

    snapshot = reduceGameState(snapshot, { type: "BORROW_AGAINST_RETURN" });
    expect(snapshot.state.kebiThreshold).toBe(6);
    expect(snapshot.state.kebi).toBe(6);
  });
});
