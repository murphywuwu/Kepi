import { describe, expect, it } from "vitest";
import { ALLY_ROWS } from "@/lib/game/boardLayout";
import { ENEMIES } from "@/data";
import { createPiece } from "@/engine/shop";
import {
  advanceBattleTick,
  applyAssassinLeap,
  createBattleSnapshot,
  enemyTypesForStage,
  hakkaAtkMultiplier,
  simulateBattle,
  spawnEnemiesForStage,
} from "./index";

function place(piece: ReturnType<typeof createPiece>, x: number, y: number) {
  piece.position = { x, y };
  return piece;
}

describe("stage enemy configuration", () => {
  it("follows V3 seven-level count curve", () => {
    expect(spawnEnemiesForStage(1)).toHaveLength(3);
    expect(spawnEnemiesForStage(2)).toHaveLength(3);
    expect(spawnEnemiesForStage(3)).toHaveLength(4);
    expect(spawnEnemiesForStage(4)).toHaveLength(4);
    expect(spawnEnemiesForStage(7)).toHaveLength(5);
  });

  it("uses designed fixed lineups for early and mid stages", () => {
    const stage1Types = enemyTypesForStage(1);
    expect(stage1Types.every((type) => ["qianhaibei", "luyinguanli"].includes(type))).toBe(
      true,
    );

    const stage3Types = enemyTypesForStage(3);
    expect(
      stage3Types.every((type) =>
        ["luyinguanli", "qianhaibei", "zhuzaiqi"].includes(type),
      ),
    ).toBe(true);
  });

  it("always includes xiedouhuo on final stage", () => {
    const stage7 = spawnEnemiesForStage(7);
    expect(stage7.some((enemy) => enemy.type === "xiedouhuo")).toBe(true);
    expect(enemyTypesForStage(7)[0]).toBe("xiedouhuo");
  });

  it("defines xiedouhuo as assassin with V2.0 base stats", () => {
    expect(ENEMIES.xiedouhuo).toMatchObject({
      role: "assassin",
      hp: 420,
      atk: 48,
    });
  });
});

describe("hakka clan synergy", () => {
  it("grants +10%/+20%/+30% atk at 2/3/4 hakka pieces", () => {
    const farmer = createPiece("farmer");
    const guard = createPiece("guard");
    const teacher = createPiece("teacher");
    const fengshui = createPiece("fengshui");

    expect(hakkaAtkMultiplier([farmer])).toBe(1);
    expect(hakkaAtkMultiplier([farmer, guard])).toBeCloseTo(1.1, 5);
    expect(hakkaAtkMultiplier([farmer, guard, teacher])).toBeCloseTo(1.2, 5);
    expect(hakkaAtkMultiplier([farmer, guard, teacher, fengshui])).toBeCloseTo(1.3, 5);
  });
});

describe("assassin AI", () => {
  it("leaps to the ally back row beside water guest on battle start", () => {
    const shuike = place(createPiece("shuike"), 4, ALLY_ROWS[0]!);
    const guard = place(createPiece("guard"), 2, ALLY_ROWS[1]!);
    const enemies = spawnEnemiesForStage(7);
    const assassin = enemies.find((enemy) => enemy.type === "xiedouhuo");
    expect(assassin).toBeDefined();

    const battle = createBattleSnapshot({
      stage: 7,
      allies: [shuike, guard],
      enemies,
    });

    const leaped = battle.enemies.find((enemy) => enemy.type === "xiedouhuo");
    expect(leaped?.position).toEqual({ x: 4, y: ALLY_ROWS[0] });
    expect(
      battle.events.some(
        (event) => event.type === "skill" && event.skillId === "assassin_leap",
      ),
    ).toBe(true);
  });

  it("prioritizes water guest as first attack target", () => {
    const shuike = place(createPiece("shuike"), 3, ALLY_ROWS[0]!);
    const guard = place(createPiece("guard"), 3, ALLY_ROWS[1]!);
    const farmer = place(createPiece("farmer"), 1, ALLY_ROWS[1]!);

    const assassin = spawnEnemiesForStage(7).find((enemy) => enemy.type === "xiedouhuo")!;
    assassin.atkSpeed = 5;
    assassin.atk = 80;
    farmer.atk = 0;
    farmer.atkSpeed = 0;
    guard.atk = 0;
    guard.atkSpeed = 0;

    let battle = createBattleSnapshot({
      stage: 7,
      allies: [shuike, guard, farmer],
      enemies: [assassin],
    });

    const step = advanceBattleTick(battle);
    battle = step.battle;
    const assassinAttack = battle.events.find(
      (event) => event.type === "attack" && event.sourceId === assassin.id,
    );
    expect(assassinAttack?.type === "attack" ? assassinAttack.targetId : null).toBe(
      shuike.id,
    );
  });

  it("applyAssassinLeap moves only assassin units", () => {
    const farmer = place(createPiece("farmer"), 2, ALLY_ROWS[1]!);
    const enemies = [
      {
        ...spawnEnemiesForStage(4)[0]!,
        type: "xiedouhuo" as const,
        id: "assassin_1",
      },
      {
        ...spawnEnemiesForStage(1)[0]!,
        id: "tank_1",
      },
    ];

    const { enemies: leaped, events } = applyAssassinLeap(enemies, [farmer]);
    expect(leaped.find((enemy) => enemy.id === "assassin_1")?.position.y).toBe(
      ALLY_ROWS[0],
    );
    expect(leaped.find((enemy) => enemy.id === "tank_1")?.position).toEqual(
      enemies[1]!.position,
    );
    expect(events).toHaveLength(1);
  });
});

describe("final stage balance with tulou buffs", () => {
  it("still pressures water guest at max home repair tier on a thin lineup", () => {
    const shuike = place(createPiece("shuike"), 3, ALLY_ROWS[0]!);
    const farmer = place(createPiece("farmer"), 4, ALLY_ROWS[1]!);
    farmer.atk = 0;
    farmer.atkSpeed = 0;

    const enemies = spawnEnemiesForStage(7).map((enemy) => ({
      ...enemy,
      atkSpeed: enemy.type === "xiedouhuo" ? 0.9 : enemy.atkSpeed * 0.75,
    }));

    const withoutBuffs = simulateBattle({
      stage: 7,
      allies: [shuike, farmer],
      enemies,
      homeRepairTier: 0,
    });
    const withMaxBuffs = simulateBattle({
      stage: 7,
      allies: [structuredClone(shuike), structuredClone(farmer)],
      enemies: enemies.map((enemy) => ({ ...enemy })),
      homeRepairTier: 3,
    });

    expect(withoutBuffs.waterGuest.died || withoutBuffs.allyHpPercent < 80).toBe(true);
    expect(withMaxBuffs.allyHpPercent).toBeGreaterThanOrEqual(withoutBuffs.allyHpPercent);
    expect(withMaxBuffs.won).toBe(false);
  });
});
