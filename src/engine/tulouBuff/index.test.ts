import { describe, expect, it } from "vitest";
import { createPiece } from "@/engine/shop";
import {
  applyTulouDamageToAlly,
  createTulouBattleBuffs,
  detectHomeRepairMilestone,
  effectiveAllyAtkSpeed,
} from "./index";

describe("home repair tiers", () => {
  it("detects 33 / 66 / 99 milestones when repair crosses thresholds", () => {
    expect(detectHomeRepairMilestone(20, 40)).toBe(33);
    expect(detectHomeRepairMilestone(50, 70)).toBe(66);
    expect(detectHomeRepairMilestone(80, 99)).toBe(99);
    expect(detectHomeRepairMilestone(40, 50)).toBeNull();
  });

  it("only rises — milestone detection ignores drops", () => {
    expect(detectHomeRepairMilestone(70, 30)).toBeNull();
  });
});

describe("tulou combat buffs", () => {
  it("grants 20% max-HP shield at tier 1+", () => {
    const farmer = createPiece("farmer");
    const buffs = createTulouBattleBuffs([farmer], 1);
    expect(buffs.shieldHp[farmer.id]).toBe(Math.round(farmer.maxHp * 0.2));
  });

  it("applies +15% ally atk speed at tier 2+", () => {
    expect(effectiveAllyAtkSpeed(1, 1)).toBe(1);
    expect(effectiveAllyAtkSpeed(1, 2)).toBeCloseTo(1.15);
    expect(effectiveAllyAtkSpeed(1, 3)).toBeCloseTo(1.15);
  });

  it("consumes shield before HP", () => {
    const farmer = createPiece("farmer");
    const runtime = createTulouBattleBuffs([farmer], 1);
    const shield = runtime.shieldHp[farmer.id]!;

    const first = applyTulouDamageToAlly(
      farmer.id,
      farmer.hp,
      farmer.maxHp,
      shield - 1,
      runtime,
      0,
    );
    expect(first.hp).toBe(farmer.hp);
    expect(first.shieldHp).toBe(1);

    const second = applyTulouDamageToAlly(
      farmer.id,
      farmer.hp,
      farmer.maxHp,
      5,
      { ...runtime, shieldHp: { [farmer.id]: first.shieldHp } },
      0,
    );
    expect(second.shieldHp).toBe(0);
    expect(second.hp).toBe(farmer.hp - 4);
  });

  it("triggers cheat-death once at tier 3, then allows death", () => {
    const farmer = createPiece("farmer");
    const runtime = createTulouBattleBuffs([farmer], 3);

    const saved = applyTulouDamageToAlly(
      farmer.id,
      farmer.hp,
      farmer.maxHp,
      farmer.hp + 500,
      runtime,
      1000,
    );
    expect(saved.hp).toBe(1);
    expect(saved.cheatDeathConsumed).toBe(true);
    expect(saved.invincibleUntil).toBe(2500);
    expect(saved.events[0]?.skillId).toBe("tulou_cheat_death");
    expect(runtime.cheatDeathAvailable.has(farmer.id)).toBe(false);
    runtime.shieldHp[farmer.id] = saved.shieldHp;
    if (saved.invincibleUntil !== null) {
      runtime.invincibleUntil[farmer.id] = saved.invincibleUntil;
    }

    const afterInvincible = applyTulouDamageToAlly(
      farmer.id,
      1,
      farmer.maxHp,
      50,
      runtime,
      2600,
    );
    expect(afterInvincible.hp).toBe(0);
  });

  it("blocks damage while invincible after cheat-death", () => {
    const farmer = createPiece("farmer");
    const runtime = createTulouBattleBuffs([farmer], 3);
    runtime.invincibleUntil[farmer.id] = 5000;

    const blocked = applyTulouDamageToAlly(
      farmer.id,
      1,
      farmer.maxHp,
      999,
      runtime,
      2000,
    );
    expect(blocked.hp).toBe(1);
    expect(blocked.cheatDeathConsumed).toBe(false);
  });
});
