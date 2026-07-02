import { z } from "zod";

const boardPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const pieceTypeSchema = z.enum([
  "farmer",
  "guard",
  "teacher",
  "fengshui",
  "patriarch",
  "shuike",
  "xiangxian",
]);

export const enemyTypeSchema = z.enum([
  "qianhaibei",
  "luyinguanli",
  "zhuzaiqi",
  "ehushan",
  "hongtouchuan",
  "xiedouhuo",
]);

export const rangeTypeSchema = z.enum(["melee", "mid", "ranged"]);

export const gameResultSchema = z.enum(["playing", "win", "lose"]).nullable();

export const endingTypeSchema = z.enum([
  "perfect_homecoming",
  "regretful_stay",
  "storm_rescue",
]).nullable();

export const scenePhaseSchema = z.enum([
  "prep",
  "opening_buff",
  "battle",
  "settlement",
  "pawn_shop",
  "campfire",
  "ending",
  "settings",
]);

export const gameStateSchema = z.object({
  stage: z.number().int().min(1),
  totalStages: z.number().int().min(1),
  totalNodes: z.number().int().min(1).default(7),
  journeyIndex: z.number().int().min(0).default(0),
  currentNodeId: z.string().min(1).default("camp-1"),
  survival: z.number().int().min(0),
  kebi: z.number().int().min(0),
  kebiThreshold: z.number().int().min(1),
  sangzi: z.number().int().min(0),
  homeRepair: z.number().min(0).max(100),
  homeRepairTier: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
  ]),
  gold: z.number().int().min(0),
  population: z.number().int().min(1),
  winStreak: z.number().int().min(0),
  loseStreak: z.number().int().min(0),
  pawnedKebi: z.number().int().min(0),
  bloodDebtCount: z.number().int().min(0).default(0),
  roundPawnCount: z.number().int().min(0).default(0),
  roundBloodDebt: z.boolean().default(false),
  nextBattleEnemyHpFactor: z.number().min(0.1).max(2).default(1),
  result: gameResultSchema,
  endingType: endingTypeSchema.default(null),
});

export const pieceSchema = z.object({
  id: z.string().min(1),
  type: pieceTypeSchema,
  cost: z.number().positive(),
  star: z.union([z.literal(1), z.literal(2)]),
  hp: z.number(),
  maxHp: z.number().positive(),
  atk: z.number().min(0),
  atkSpeed: z.number().min(0),
  armor: z.number().min(0),
  range: rangeTypeSchema,
  clan: z.string(),
  position: boardPositionSchema.nullable(),
});

export const enemySchema = z.object({
  id: z.string().min(1),
  type: enemyTypeSchema,
  hp: z.number(),
  maxHp: z.number().positive(),
  atk: z.number().min(0),
  atkSpeed: z.number().min(0),
  armor: z.number().min(0),
  range: rangeTypeSchema,
  position: boardPositionSchema,
});

export const battleEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("attack"),
    sourceId: z.string(),
    targetId: z.string(),
    damage: z.number(),
  }),
  z.object({
    type: z.literal("kill"),
    unitId: z.string(),
  }),
  z.object({
    type: z.literal("skill"),
    sourceId: z.string(),
    skillId: z.string(),
  }),
  z.object({
    type: z.literal("roundEnd"),
  }),
  z.object({
    type: z.literal("waterGuestSurvived"),
  }),
  z.object({
    type: z.literal("waterGuestDied"),
  }),
  z.object({
    type: z.literal("leafFallStart"),
  }),
  z.object({
    type: z.literal("leafFallEnd"),
  }),
]);

export const shopStateSchema = z.object({
  slots: z.array(pieceTypeSchema),
  refreshCost: z.number().int().min(0),
});

export const battleResultSchema = z.object({
  won: z.boolean(),
  tick: z.number().int().min(0),
  elapsedMs: z.number().min(0),
  events: z.array(battleEventSchema),
  alliesRemaining: z.number().int().min(0),
  enemiesRemaining: z.number().int().min(0),
  allyHpPercent: z.number().min(0),
  enemyHpPercent: z.number().min(0),
  waterGuest: z.object({
    pieceId: z.string().nullable(),
    deployed: z.boolean(),
    survived: z.boolean(),
    died: z.boolean(),
  }),
});

export const settlementSummarySchema = z.object({
  won: z.boolean(),
  kebiGained: z.number().int().min(0),
  sangziGained: z.number().int().min(0),
  sangziConsumed: z.number().int().min(0),
  homeRepairBefore: z.number().min(0).max(100),
  homeRepairGained: z.number().min(0).max(100),
  homeRepairAfter: z.number().min(0).max(100),
  survivalLost: z.number().int().min(0),
  waterGuestDeployed: z.boolean(),
  waterGuestSurvived: z.boolean(),
  waterGuestDied: z.boolean(),
  xiangxianBonusApplied: z.boolean(),
  homeRepairMilestone: z.union([z.literal(33), z.literal(66), z.literal(99)]).nullable(),
});

export const gameSnapshotSchema = z.object({
  version: z.number().int().min(1),
  phase: scenePhaseSchema,
  state: gameStateSchema,
  board: z.array(pieceSchema),
  shop: shopStateSchema,
      battle: z
    .object({
      tick: z.number().int().min(0),
      elapsedMs: z.number().min(0),
      allies: z.array(pieceSchema),
      enemies: z.array(enemySchema),
      events: z.array(battleEventSchema),
      cooldowns: z.record(z.string(), z.number()).optional(),
      finished: z.boolean().optional(),
      waterGuest: z.object({
        pieceId: z.string().nullable(),
        deployed: z.boolean(),
        survived: z.boolean(),
        died: z.boolean(),
      }),
      tulouBuffs: z
        .object({
          tier: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
          shieldHp: z.record(z.string(), z.number()),
          cheatDeathAvailable: z.array(z.string()),
          invincibleUntil: z.record(z.string(), z.number()),
        })
        .optional(),
    })
    .nullable()
    .optional(),
  lastBattleResult: battleResultSchema.nullable().optional(),
  settlement: settlementSummarySchema.nullable().optional(),
  openingBuff: z
    .object({
      offered: z.object({
        id: z.string(),
        label: z.string(),
        description: z.string(),
        atkMultiplier: z.number(),
        goldBonus: z.number().optional(),
      }),
      caught: z.boolean(),
      resolved: z.boolean(),
    })
    .nullable()
    .optional(),
  activeOpeningBuff: z
    .object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
      atkMultiplier: z.number(),
      goldBonus: z.number().optional(),
    })
    .nullable()
    .optional(),
  campfire: z
    .object({
      scenarioId: z.string(),
      choiceAId: z.string(),
      choiceBId: z.string(),
    })
    .nullable()
    .optional(),
});

export type GameSnapshotInput = z.infer<typeof gameSnapshotSchema>;
