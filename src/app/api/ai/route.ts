import { pickFallbackLetter } from "@/lib/ai/fallback";
import {
  generateTurnNarrative,
  generateTurnNarrativeFallback,
} from "@/lib/ai/narrativeServer";
import { generateDigitalLetter } from "@/lib/ai/server";
import type {
  AILetterResponse,
  AIResponse,
  TurnNarrative,
} from "@/lib/ai/types";
import { aiRequestSchema } from "@/lib/schemas/ai";
import { NextResponse } from "next/server";

const DEFAULT_LETTER_INPUT = {
  stage: 1,
  kebi: 0,
  homeRepair: 0,
  survival: 2,
  battleSummary: "AI 代理不可用",
};

const DEFAULT_NARRATIVE_INPUT = {
  turn: 1,
  events: {
    didPawn: false,
    pawnCount: 0,
    waterGuestDied: false,
    waterGuestSurvived: false,
    won: false,
  },
  currentKebi: 0,
  currentHomeRepair: 0,
  survival: 2,
};

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = aiRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          fallback: pickFallbackLetter(DEFAULT_LETTER_INPUT),
        } satisfies AIResponse,
        { status: 400 },
      );
    }

    if (parsed.data.kind === "digital-letter") {
      try {
        const data = await generateDigitalLetter(parsed.data.input);
        return NextResponse.json({ ok: true, data } satisfies AIResponse);
      } catch {
        const fallback = pickFallbackLetter(parsed.data.input);
        return NextResponse.json(
          { ok: false, fallback } satisfies AIResponse,
          { status: 503 },
        );
      }
    }

    try {
      const data = await generateTurnNarrative(parsed.data.input);
      return NextResponse.json({ ok: true, data } satisfies AIResponse);
    } catch {
      const fallback = generateTurnNarrativeFallback(parsed.data.input);
      return NextResponse.json(
        { ok: false, fallback } satisfies AIResponse,
        { status: 503 },
      );
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        fallback: pickFallbackLetter(DEFAULT_LETTER_INPUT),
      } satisfies AIResponse,
      { status: 503 },
    );
  }
}

export type { AILetterResponse, TurnNarrative };
