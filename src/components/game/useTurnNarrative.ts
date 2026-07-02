"use client";

import { useEffect, useState } from "react";
import { requestTurnNarrative } from "@/lib/ai/client";
import type { TurnNarrative, TurnNarrativeInput } from "@/lib/ai/types";

export function useTurnNarrative(
  input: TurnNarrativeInput | null,
  cacheKey: string,
): { narrative: TurnNarrative | null; loading: boolean; fromAI: boolean } {
  const [narrative, setNarrative] = useState<TurnNarrative | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromAI, setFromAI] = useState(false);

  useEffect(() => {
    if (!input || !cacheKey) return;

    let cancelled = false;
    const loadingTimer = window.setTimeout(() => {
      if (!cancelled) setLoading(true);
    }, 0);

    void requestTurnNarrative(input).then((result) => {
      if (cancelled) return;
      setNarrative(result.narrative);
      setFromAI(result.fromAI);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
    };
  }, [cacheKey, input]);

  if (!input || !cacheKey) {
    return { narrative: null, loading: false, fromAI: false };
  }

  return { narrative, loading, fromAI };
}
