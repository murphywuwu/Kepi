import { describe, expect, it } from "vitest";
import { homeRepairTierFromRepair } from "@/data/balance";
import { createPiece } from "@/engine/shop";
import { simulateBattle } from "@/engine/battle";
import {
  createTulouBattleBuffs,
  effectiveAllyAtkSpeed,
} from "@/engine/tulouBuff";

/**
 * P2 sanity check: cumulative tulou buffs ramp across a typical 4-win run
 * without reaching max tier before the final stage (avoids endgame steamroll).
 */
describe("tulou buff balance (P2)", () => {
  it("reaches tier 2 by the 4th win but not tier 3 in a standard no-xiangxian run", () => {
    const repairs = [0, 20, 40, 60, 80];
    const tiers = repairs.map(homeRepairTierFromRepair);
    expect(tiers).toEqual([0, 0, 1, 1, 2]);
  });

  it("tier 3 stacks shield, atk speed, and cheat-death simultaneously", () => {
    const farmer = createPiece("farmer");
    const buffs = createTulouBattleBuffs([farmer], 3);
    expect(buffs.shieldHp[farmer.id]).toBeGreaterThan(0);
    expect(effectiveAllyAtkSpeed(1, 3)).toBeCloseTo(1.15);
    expect(buffs.cheatDeathAvailable.has(farmer.id)).toBe(true);
  });

  it("tier 3 does not guarantee instant stage-4 wipe against default enemies", () => {
    const board = ["farmer", "guard", "teacher"].map((type, index) => {
      const piece = createPiece(type as "farmer");
      piece.position = { x: index, y: 5 };
      return piece;
    });

    const result = simulateBattle({
      stage: 4,
      allies: board,
      homeRepairTier: 3,
    });

    expect(result.elapsedMs).toBeGreaterThan(500);
  });
});
