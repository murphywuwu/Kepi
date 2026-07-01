import type { HomeRepairMilestone } from "@/types";

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
  waterGuestDied: boolean;
  waterGuestSurvived: boolean;
  won: boolean;
  clutchUnit?: string;
  homeRepairMilestone?: HomeRepairMilestone;
};

export type TurnNarrativeInput = {
  turn: number;
  events: TurnNarrativeEvents;
  currentKebi: number;
  currentHomeRepair: number;
  survival: number;
};

export type TurnNarrative = {
  text: string;
  author: string;
};

export type AIRequest =
  | { kind: "digital-letter"; input: AIPromptInput }
  | { kind: "turn-narrative"; input: TurnNarrativeInput };

export type AIResponse =
  | { ok: true; data: AILetterResponse | TurnNarrative }
  | { ok: false; fallback: AILetterResponse | TurnNarrative };

export type DigitalLetterResult = {
  letter: AILetterResponse;
  fromAI: boolean;
};

export type TurnNarrativeResult = {
  narrative: TurnNarrative;
  fromAI: boolean;
};
