import { pickFallbackLetter } from "./fallback";
import { pickFallbackNarrative } from "./narrativeFallback";
import type {
  AIPromptInput,
  AIRequest,
  AIResponse,
  DigitalLetterResult,
  TurnNarrativeInput,
  TurnNarrativeResult,
} from "./types";

export async function requestDigitalLetter(
  input: AIPromptInput,
): Promise<DigitalLetterResult> {
  const payload: AIRequest = { kind: "digital-letter", input };

  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    const data = (await response.json()) as AIResponse;
    if (data.ok && "title" in data.data) {
      return { letter: data.data, fromAI: true };
    }
    if (!data.ok && "title" in data.fallback) {
      return { letter: data.fallback, fromAI: false };
    }
    return { letter: pickFallbackLetter(input), fromAI: false };
  } catch {
    return { letter: pickFallbackLetter(input), fromAI: false };
  }
}

export async function requestTurnNarrative(
  input: TurnNarrativeInput,
): Promise<TurnNarrativeResult> {
  const payload: AIRequest = { kind: "turn-narrative", input };

  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    const data = (await response.json()) as AIResponse;
    if (data.ok && "text" in data.data) {
      return { narrative: data.data, fromAI: true };
    }
    if (!data.ok && "text" in data.fallback) {
      return { narrative: data.fallback, fromAI: false };
    }
    return { narrative: pickFallbackNarrative(input), fromAI: false };
  } catch {
    return { narrative: pickFallbackNarrative(input), fromAI: false };
  }
}

export async function requestDigitalLetters(
  input: AIPromptInput,
  count: number,
): Promise<DigitalLetterResult[]> {
  const safeCount = Math.max(1, Math.min(count, 5));
  const results: DigitalLetterResult[] = [];

  for (let i = 0; i < safeCount; i += 1) {
    const result = await requestDigitalLetter({
      ...input,
      battleSummary: `${input.battleSummary} · 第 ${i + 1} 封`,
    });
    results.push(result);
  }

  return results;
}
