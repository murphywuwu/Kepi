"use client";

import { useEffect, useState } from "react";
import { EndingScene } from "@/components/game/ending";
import type { GestureMode } from "@/components/game/ending";
import {
  endingBattleSummaryFromSnapshot,
  endingContextFromSnapshot,
  resolveSnapshotEndingType,
} from "@/lib/game/ending";
import { loadSettings } from "@/lib/storage/settings";
import { useGameStore } from "@/store/gameStore";

export function EndingPhase() {
  const snapshot = useGameStore((state) => state.snapshot);
  const resetGame = useGameStore((state) => state.resetGame);
  const { state } = snapshot;
  const endingType = resolveSnapshotEndingType(snapshot);
  const narrative = endingContextFromSnapshot(snapshot);
  const [gestureMode, setGestureMode] = useState<GestureMode>("pointer");

  useEffect(() => {
    setGestureMode(loadSettings().gestureEnabled ? "gesture" : "pointer");
  }, []);

  return (
    <EndingScene
      className="h-full"
      endingType={endingType}
      narrative={narrative}
      stage={state.stage}
      battleSummary={endingBattleSummaryFromSnapshot(snapshot)}
      gestureMode={gestureMode}
      onComplete={() => resetGame()}
    />
  );
}
