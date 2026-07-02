import { z } from "zod";

export const aiPromptInputSchema = z.object({
  stage: z.number().int().min(1).max(6),
  kebi: z.number().int().min(0).max(6),
  homeRepair: z.number().min(0).max(100),
  survival: z.number().int().min(0).max(3),
  battleSummary: z.string().min(1).max(500),
  result: z.enum(["win", "lose"]).optional(),
});

export const aiLetterResponseSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(800),
  voiceText: z.string().max(800).optional(),
  source: z.string().max(120).optional(),
});

export const turnNarrativeEventsSchema = z.object({
  didPawn: z.boolean(),
  pawnCount: z.number().int().min(0).max(6),
  didBloodDebt: z.boolean().default(false),
  waterGuestDied: z.boolean(),
  waterGuestSurvived: z.boolean(),
  won: z.boolean(),
  clutchUnit: z.string().min(1).max(32).optional(),
  homeRepairMilestone: z.union([z.literal(33), z.literal(66), z.literal(99)]).optional(),
  outcomeTone: z.enum(["crushing", "clutch", "narrow"]).optional(),
});

export const turnNarrativeInputSchema = z.object({
  turn: z.number().int().min(1).max(8),
  events: turnNarrativeEventsSchema,
  currentKebi: z.number().int().min(0).max(8),
  currentHomeRepair: z.number().min(0).max(100),
  survival: z.number().int().min(0).max(3),
  winStreak: z.number().int().min(0).max(8).default(0),
  deathCount: z.number().int().min(0).max(3).default(0),
});

export const campfireCopyInputSchema = z.object({
  nodeId: z.string().min(1),
  homeRepair: z.number().min(0).max(100),
  kebi: z.number().int().min(0),
  survival: z.number().int().min(0),
  bloodDebtCount: z.number().int().min(0),
});

export const campfireCopyResultSchema = z.object({
  prompt: z.string().min(4).max(200),
  choiceA: z.string().min(1).max(40),
  choiceB: z.string().min(1).max(40),
  fromAI: z.boolean().optional(),
});

export const turnNarrativeSchema = z.object({
  text: z.string().min(4).max(80),
  author: z.string().min(2).max(32),
});

export const aiRequestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("digital-letter"),
    input: aiPromptInputSchema,
  }),
  z.object({
    kind: z.literal("turn-narrative"),
    input: turnNarrativeInputSchema,
  }),
  z.object({
    kind: z.literal("campfire-choice-copy"),
    input: campfireCopyInputSchema,
  }),
]);

export type AIPromptInputParsed = z.infer<typeof aiPromptInputSchema>;
export type AILetterResponseParsed = z.infer<typeof aiLetterResponseSchema>;
export type TurnNarrativeInputParsed = z.infer<typeof turnNarrativeInputSchema>;
export type TurnNarrativeParsed = z.infer<typeof turnNarrativeSchema>;
