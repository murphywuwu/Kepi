import { describe, expect, it } from "vitest";
import { createPiece } from "@/engine/shop";
import { createBattleSnapshot, advanceBattleTick } from "@/engine/battle";

describe("leaf fall juice (V3.1)", () => {
  it("triggers leafFallStart when four hakka clan allies present", () => {
    const allies = [
      createPiece("farmer", 1),
      createPiece("guard", 1),
      createPiece("teacher", 1),
      createPiece("fengshui", 1),
    ];

    const battle = createBattleSnapshot({ stage: 1, allies });
    const step = advanceBattleTick(battle);

    expect(step.battle.events.some((event) => event.type === "leafFallStart")).toBe(true);
    expect(step.battle.leafFall?.triggered).toBe(true);
  });
});
