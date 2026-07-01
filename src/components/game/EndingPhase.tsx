"use client";

import { EndingScene } from "@/components/game/ending";
import {
  endingBattleSummaryFromSnapshot,
  endingContextFromSnapshot,
  resolveSnapshotEndingType,
} from "@/lib/game/ending";
import { useGameStore } from "@/store/gameStore";

export function EndingPhase() {
  const snapshot = useGameStore((state) => state.snapshot);
  const resetGame = useGameStore((state) => state.resetGame);
  const { state } = snapshot;
  const endingType = resolveSnapshotEndingType(snapshot);
  const narrative = endingContextFromSnapshot(snapshot);

  return (
    <EndingScene
      className="h-full"
      endingType={endingType}
      narrative={narrative}
      stage={state.stage}
      battleSummary={endingBattleSummaryFromSnapshot(snapshot)}
      gestureMode="pointer"
      onComplete={() => resetGame()}
    />
  );
}
