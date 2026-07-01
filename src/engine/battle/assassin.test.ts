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
  it("follows V2.0 count and scaling curve", () => {
    expect(spawnEnemiesForStage(1)).toHaveLength(3);
    expect(spawnEnemiesForStage(2)).toHaveLength(4);
    expect(spawnEnemiesForStage(3)).toHaveLength(4);
    expect(spawnEnemiesForStage(4)).toHaveLength(5);
  });

  it("uses tutorial pool on stage 1 and mid pool on stage 3", () => {
    const stage1Types = enemyTypesForStage(1);
    expect(stage1Types.every((type) => ["qianhaibei", "luyinguanli"].includes(type))).toBe(
      true,
    );

    const stage3Types = enemyTypesForStage(3);
    expect(
      stage3Types.every((type) =>
        ["zhuzaiqi", "ehushan", "hongtouchuan"].includes(type),
      ),
    ).toBe(true);
  });

  it("always includes xiedouhuo on stage 4", () => {
    const stage4 = spawnEnemiesForStage(4);
    expect(stage4.some((enemy) => enemy.type === "xiedouhuo")).toBe(true);
    expect(enemyTypesForStage(4)[0]).toBe("xiedouhuo");
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
    const enemies = spawnEnemiesForStage(4);
    const assassin = enemies.find((enemy) => enemy.type === "xiedouhuo");
    expect(assassin).toBeDefined();

    const battle = createBattleSnapshot({
      stage: 4,
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

    const assassin = spawnEnemiesForStage(4).find((enemy) => enemy.type === "xiedouhuo")!;
    assassin.atkSpeed = 5;
    assassin.atk = 80;
    farmer.atk = 0;
    farmer.atkSpeed = 0;
    guard.atk = 0;
    guard.atkSpeed = 0;

    let battle = createBattleSnapshot({
      stage: 4,
      allies: [shuike, guard, farmer],
      enemies: [assassin],
    });

    const step = advanceBattleTick(battle);
    battle = step.battle;
    const assassinAttack = battle.events.find(
      (event) => event.type === "attack" && event.sourceId === assassin.id,
    );
    expect(assassinAttack?.targetId).toBe(shuike.id);
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

describe("stage 4 balance with tulou buffs", () => {
  it("still pressures water guest at max home repair tier on a thin lineup", () => {
    const shuike = place(createPiece("shuike"), 3, ALLY_ROWS[0]!);
    const farmer = place(createPiece("farmer"), 4, ALLY_ROWS[1]!);
    farmer.atk = 0;
    farmer.atkSpeed = 0;

    const enemies = spawnEnemiesForStage(4).map((enemy) => ({
      ...enemy,
      atkSpeed: enemy.type === "xiedouhuo" ? 0.9 : enemy.atkSpeed * 0.75,
    }));

    const withoutBuffs = simulateBattle({
      stage: 4,
      allies: [shuike, farmer],
      enemies,
      homeRepairTier: 0,
    });
    const withMaxBuffs = simulateBattle({
      stage: 4,
      allies: [structuredClone(shuike), structuredClone(farmer)],
      enemies: enemies.map((enemy) => ({ ...enemy })),
      homeRepairTier: 3,
    });

    expect(withoutBuffs.waterGuest.died || withoutBuffs.allyHpPercent < 80).toBe(true);
    expect(withMaxBuffs.allyHpPercent).toBeGreaterThanOrEqual(withoutBuffs.allyHpPercent);
    expect(withMaxBuffs.won).toBe(false);
  });
});
