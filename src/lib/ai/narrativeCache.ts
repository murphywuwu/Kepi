import { narrativeCacheKey, pickFallbackNarrative } from "./narrativeFallback";
import type { TurnNarrative, TurnNarrativeInput } from "./types";

const cache = new Map<string, TurnNarrative>();

export function getCachedNarrative(key: string): TurnNarrative | undefined {
  return cache.get(key);
}

export function setCachedNarrative(key: string, narrative: TurnNarrative): void {
  if (cache.size >= 128) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, narrative);
}

export function resolveNarrativeWithCache(
  input: TurnNarrativeInput,
  generated?: TurnNarrative,
): TurnNarrative {
  const key = narrativeCacheKey(input);
  if (generated) {
    setCachedNarrative(key, generated);
    return generated;
  }

  const cached = getCachedNarrative(key);
  if (cached) return cached;

  const fallback = pickFallbackNarrative(input);
  setCachedNarrative(key, fallback);
  return fallback;
}

/** Test helper — clears in-memory narrative cache. */
export function clearNarrativeCache(): void {
  cache.clear();
}
