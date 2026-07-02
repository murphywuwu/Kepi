import type { HomeRepairMilestone } from "@/types";

export const AI_REQUEST_TIMEOUT_MS = 1500;

export type NarrativeTags = {
  deathCount: number;
  didPawn: boolean;
  didBloodDebt: boolean;
  winStreak: number;
  waterGuestSurvived: boolean;
  waterGuestDied: boolean;
  homeRepairMilestone?: HomeRepairMilestone;
  /** Battle outcome tone bucket for fallback pools. */
  outcomeTone?: "crushing" | "clutch" | "narrow";
};

export type AIPromptInput = {
  stage: number;
  kebi: number;
  homeRepair: number;
  survival: number;
  battleSummary: string;
  result?: "win" | "lose";
};

export type AILetterResponse = {
  title: string;
  body: string;
  voiceText?: string;
  source?: string;
};

export type TurnNarrativeEvents = {
  didPawn: boolean;
  pawnCount: number;
  didBloodDebt: boolean;
  waterGuestDied: boolean;
  waterGuestSurvived: boolean;
  won: boolean;
  clutchUnit?: string;
  homeRepairMilestone?: HomeRepairMilestone;
  outcomeTone?: "crushing" | "clutch" | "narrow";
};

export type TurnNarrativeInput = {
  turn: number;
  events: TurnNarrativeEvents;
  currentKebi: number;
  currentHomeRepair: number;
  survival: number;
  winStreak: number;
  deathCount: number;
};

export type TurnNarrative = {
  text: string;
  author: string;
};

export type CampfireCopyInput = {
  nodeId: string;
  homeRepair: number;
  kebi: number;
  survival: number;
  bloodDebtCount: number;
};

export type CampfireCopyResult = {
  prompt: string;
  choiceA: string;
  choiceB: string;
  fromAI: boolean;
};

export type AIRequest =
  | { kind: "digital-letter"; input: AIPromptInput }
  | { kind: "turn-narrative"; input: TurnNarrativeInput }
  | { kind: "campfire-choice-copy"; input: CampfireCopyInput };

export type AIResponse =
  | { ok: true; data: AILetterResponse | TurnNarrative | CampfireCopyResult }
  | { ok: false; fallback: AILetterResponse | TurnNarrative | CampfireCopyResult };

export type DigitalLetterResult = {
  letter: AILetterResponse;
  fromAI: boolean;
};

export type TurnNarrativeResult = {
  narrative: TurnNarrative;
  fromAI: boolean;
};
