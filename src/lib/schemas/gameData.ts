import { z } from "zod";

const rangeSchema = z.enum(["melee", "mid", "ranged"]);

export const pieceDefinitionSchema = z.object({
  type: z.enum([
    "farmer",
    "guard",
    "teacher",
    "fengshui",
    "patriarch",
    "shuike",
    "xiangxian",
  ]),
  name: z.string().min(1),
  cost: z.number().int().min(1).max(5),
  hp: z.number().int().positive(),
  atk: z.number().int().nonnegative(),
  atkSpeed: z.number().nonnegative(),
  armor: z.number().int().nonnegative(),
  range: rangeSchema,
  clan: z.string().min(1),
  skillId: z.string().min(1),
  description: z.string().min(1),
  assetId: z.string().min(1),
  portrait: z.string().startsWith("/images/"),
});

export const enemyDefinitionSchema = z.object({
  type: z.enum([
    "qianhaibei",
    "luyinguanli",
    "zhuzaiqi",
    "ehushan",
    "hongtouchuan",
    "xiedouhuo",
  ]),
  name: z.string().min(1),
  assetId: z.string().min(1),
  portrait: z.string().startsWith("/images/"),
  hp: z.number().int().positive(),
  atk: z.number().int().positive(),
  atkSpeed: z.number().positive(),
  armor: z.number().int().nonnegative(),
  range: rangeSchema,
  role: z.enum(["tank", "warrior", "control", "dps", "ranged", "assassin"]),
  historicalNote: z.string().min(1),
  description: z.string().min(1),
});

export const stageDefinitionSchema = z.object({
  stage: z.number().int().min(1).max(4),
  name: z.string().min(1),
  enemyCount: z.number().int().min(1).max(6),
  scaling: z.number().positive(),
  enemyPool: z.array(enemyDefinitionSchema.shape.type).min(1),
  prepTimeSec: z.number().int().positive(),
  difficulty: z.enum(["tutorial", "normal", "hard"]),
  aiDynamic: z.boolean(),
  boardAsset: z.string().startsWith("/images/"),
});

export const balanceSchema = z.object({
  snapshotVersion: z.literal(2),
  initial: z.object({
    stage: z.literal(1),
    totalStages: z.literal(4),
    survival: z.literal(2),
    kebi: z.literal(0),
    kebiThreshold: z.literal(4),
    sangzi: z.literal(0),
    homeRepair: z.literal(0),
    homeRepairTier: z.literal(0),
    gold: z.literal(10),
    population: z.literal(3),
    winStreak: z.literal(0),
    loseStreak: z.literal(0),
    pawnedKebi: z.literal(0),
    roundPawnCount: z.literal(0),
    result: z.null(),
    endingType: z.null(),
  }),
  population: z.object({
    max: z.literal(6),
    upgradeCost: z.literal(4),
  }),
  economy: z.object({
    roundWage: z.literal(5),
    shopRefreshCost: z.literal(1),
    shopSlotCount: z.literal(5),
    pawnGold: z.literal(15),
  }),
  battle: z.object({
    tickMs: z.literal(8),
    maxMs: z.literal(40_000),
    ticksPerFrameCap: z.literal(22),
    prepTimeSec: z.literal(30),
    damageFormula: z.literal("atk * 100 / (100 + armor)"),
    enemyHpFactor: z.literal(0.55),
    damageMultiplier: z.literal(1.75),
  }),
  progression: z.object({
    sangziPerWin: z.literal(20),
    homeRepairPerWin: z.literal(20),
    starHpAtkMultiplier: z.literal(2),
    xiangxianRepairBonus: z.literal(1.5),
  }),
  tulouBuff: z.object({
    shieldRatio: z.literal(0.2),
    atkSpeedBonus: z.literal(0.15),
    cheatDeathInvincibleMs: z.literal(1500),
    milestones: z.tuple([z.literal(33), z.literal(66), z.literal(99)]),
  }),
});

export const archivalLetterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  originalText: z.string().min(1),
  modernText: z.string().min(1),
  source: z.string().min(1),
  voiceAudio: z.string().nullable(),
});

export const digitalLetterFallbackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string()).min(1),
});
