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
  waterGuestDied: z.boolean(),
  waterGuestSurvived: z.boolean(),
  won: z.boolean(),
  clutchUnit: z.string().min(1).max(32).optional(),
  homeRepairMilestone: z.union([z.literal(33), z.literal(66), z.literal(99)]).optional(),
});

export const turnNarrativeInputSchema = z.object({
  turn: z.number().int().min(1).max(6),
  events: turnNarrativeEventsSchema,
  currentKebi: z.number().int().min(0).max(6),
  currentHomeRepair: z.number().min(0).max(100),
  survival: z.number().int().min(0).max(3),
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
]);

export type AIPromptInputParsed = z.infer<typeof aiPromptInputSchema>;
export type AILetterResponseParsed = z.infer<typeof aiLetterResponseSchema>;
export type TurnNarrativeInputParsed = z.infer<typeof turnNarrativeInputSchema>;
export type TurnNarrativeParsed = z.infer<typeof turnNarrativeSchema>;
