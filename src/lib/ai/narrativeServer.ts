import { turnNarrativeSchema } from "@/lib/schemas/ai";
import { narrativeCacheKey, pickFallbackNarrative } from "./narrativeFallback";
import {
  getCachedNarrative,
  resolveNarrativeWithCache,
  setCachedNarrative,
} from "./narrativeCache";
import {
  buildTurnNarrativeUserPrompt,
  TURN_NARRATIVE_SYSTEM_PROMPT,
} from "./narrativePrompt";
import type { TurnNarrative, TurnNarrativeInput } from "./types";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
};

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() ?? text.trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response missing JSON object");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function normalizeNarrative(raw: unknown): TurnNarrative {
  const parsed = turnNarrativeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("AI response failed schema validation");
  }
  return parsed.data;
}

export async function generateTurnNarrative(
  input: TurnNarrativeInput,
): Promise<TurnNarrative> {
  const key = narrativeCacheKey(input);
  const cached = getCachedNarrative(key);
  if (cached) return cached;

  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured");
  }

  const baseUrl = (process.env.AI_API_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.65,
      max_tokens: 96,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: TURN_NARRATIVE_SYSTEM_PROMPT },
        { role: "user", content: buildTurnNarrativeUserPrompt(input) },
      ],
    }),
    signal: AbortSignal.timeout(1500),
  });

  if (!response.ok) {
    throw new Error(`AI provider responded with ${response.status}`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI provider returned empty content");
  }

  const narrative = normalizeNarrative(extractJsonObject(content));
  setCachedNarrative(key, narrative);
  return narrative;
}

export function generateTurnNarrativeFallback(
  input: TurnNarrativeInput,
): TurnNarrative {
  return resolveNarrativeWithCache(input);
}

export { pickFallbackNarrative };
