import { describe, expect, it } from "vitest";
import {
  ARCHIVAL_LETTERS,
  BALANCE,
  DIGITAL_LETTER_FALLBACKS,
  ENEMIES,
  ENEMY_TYPES,
  PIECES,
  PIECE_TYPES,
  STAGES,
  enemyCount,
  pickDigitalLetterFallback,
  scaledEnemyStats,
  stageScalingFactor,
} from "@/data";
import { calcDamage, spawnEnemiesForStage } from "@/engine/battle";
import { createPiece } from "@/engine/shop";
import {
  archivalLetterSchema,
  balanceSchema,
  digitalLetterFallbackSchema,
  enemyDefinitionSchema,
  pieceDefinitionSchema,
  stageDefinitionSchema,
} from "@/lib/schemas";

describe("static data schemas", () => {
  it("validates balance against V3.1 initial values", () => {
    expect(() => balanceSchema.parse(BALANCE)).not.toThrow();
    expect(BALANCE.initial.survival).toBe(2);
    expect(BALANCE.initial.totalNodes).toBe(7);
    expect(BALANCE.initial.kebiThreshold).toBe(5);
    expect(BALANCE.initial.gold).toBe(10);
    expect(BALANCE.initial.population).toBe(3);
    expect(BALANCE.initial.pawnedKebi).toBe(0);
    expect(BALANCE.initial.bloodDebtCount).toBe(0);
    expect(BALANCE.initial.homeRepairTier).toBe(0);
  });

  it("validates all piece definitions", () => {
    for (const piece of Object.values(PIECES)) {
      expect(() => pieceDefinitionSchema.parse(piece)).not.toThrow();
    }
    expect(PIECE_TYPES).toHaveLength(7);
  });

  it("includes shuike and xiangxian as recruitable pieces", () => {
    expect(PIECE_TYPES).toContain("shuike");
    expect(PIECE_TYPES).toContain("xiangxian");
  });

  it("validates all enemy definitions", () => {
    for (const enemy of Object.values(ENEMIES)) {
      expect(() => enemyDefinitionSchema.parse(enemy)).not.toThrow();
    }
    expect(ENEMY_TYPES).toHaveLength(6);
  });

  it("validates seven stage definitions with scaling curve", () => {
    expect(STAGES).toHaveLength(7);
    for (const stage of STAGES) {
      expect(() => stageDefinitionSchema.parse(stage)).not.toThrow();
    }
    expect(stageScalingFactor(1)).toBe(1);
    expect(stageScalingFactor(2)).toBe(1);
    expect(stageScalingFactor(3)).toBe(1.35);
    expect(stageScalingFactor(4)).toBe(1.7);
    expect(stageScalingFactor(7)).toBe(2.5);
    expect(enemyCount(1)).toBe(3);
    expect(enemyCount(2)).toBe(3);
    expect(enemyCount(3)).toBe(4);
    expect(enemyCount(4)).toBe(4);
    expect(enemyCount(7)).toBe(5);
    expect(STAGES[0]?.enemyPool).toEqual(["qianhaibei", "luyinguanli", "qianhaibei"]);
    expect(STAGES[6]?.enemyPool).toContain("xiedouhuo");
    expect(STAGES[0]?.boardAsset).toBe("/images/board/kepi_tulou-stage1-broken.png");
    expect(STAGES[1]?.boardAsset).toBe("/images/board/kepi_tulou-stage2-well.png");
  });

  it("validates archival and fallback letters", () => {
    for (const letter of ARCHIVAL_LETTERS) {
      expect(() => archivalLetterSchema.parse(letter)).not.toThrow();
    }
    expect(ARCHIVAL_LETTERS).toHaveLength(3);
    expect(ARCHIVAL_LETTERS[0]?.id).toBe("ye-heren-1887");
    expect(DIGITAL_LETTER_FALLBACKS.length).toBeGreaterThanOrEqual(8);
    for (const letter of DIGITAL_LETTER_FALLBACKS) {
      expect(() => digitalLetterFallbackSchema.parse(letter)).not.toThrow();
    }
  });
});

describe("static data engine consumption", () => {
  it("creates pieces from data templates with star scaling", () => {
    const farmer = createPiece("farmer", 1);
    expect(farmer.hp).toBe(PIECES.farmer.hp);
    expect(farmer.atk).toBe(PIECES.farmer.atk);

    const farmer2 = createPiece("farmer", 2);
    expect(farmer2.hp).toBe(PIECES.farmer.hp * 2);
    expect(farmer2.atk).toBe(PIECES.farmer.atk * 2);
  });

  it("spawns enemies using per-type stats, stage scaling, and battle HP factor", () => {
    const stage1 = spawnEnemiesForStage(1);
    expect(stage1).toHaveLength(3);
    const base = scaledEnemyStats(stage1[0]!.type, 1).hp;
    expect(stage1[0]?.hp).toBe(Math.max(1, Math.round(base * BALANCE.battle.enemyHpFactor)));

    const stage7 = spawnEnemiesForStage(7);
    expect(stage7).toHaveLength(5);
    expect(stage7.some((enemy) => enemy.type === "xiedouhuo")).toBe(true);
    const scaled = scaledEnemyStats("xiedouhuo", 2.5).hp;
    expect(stage7.find((enemy) => enemy.type === "xiedouhuo")?.hp).toBe(
      Math.max(1, Math.round(scaled * BALANCE.battle.enemyHpFactor)),
    );
  });

  it("uses PRD damage formula with battle multiplier", () => {
    const raw = (35 * 100) / (100 + 10);
    expect(calcDamage(35, 10)).toBeCloseTo(raw * BALANCE.battle.damageMultiplier, 2);
  });

  it("uses V3.1 fixed node wage", () => {
    expect(BALANCE.economy.nodeWage).toBe(5);
    expect(BALANCE.economy.shopRefreshCost).toBe(1);
    expect(BALANCE.economy.pawnGold).toBe(15);
    expect(BALANCE.economy.bloodDebtGold).toBe(35);
  });

  it("provides deterministic AI fallback letters", () => {
    const a = pickDigitalLetterFallback(42);
    const b = pickDigitalLetterFallback(42);
    expect(a.id).toBe(b.id);
  });
});
