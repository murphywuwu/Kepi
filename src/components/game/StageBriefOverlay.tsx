"use client";

import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { isPrepInteractive } from "@/lib/game/prepUi";
import { StageBriefCard, stageBriefDismissCta } from "./StageBriefCard";

export function StageBriefOverlay() {
  const snapshot = useGameStore((state) => state.snapshot);
  const prepSubview = useUIStore((state) => state.prepSubview);
  const dismissStageBrief = useUIStore((state) => state.dismissStageBrief);
  const { phase, state } = snapshot;

  if (phase !== "prep" || isPrepInteractive(prepSubview)) return null;

  return (
    <div
      className="kepi-stage-brief-overlay pointer-events-auto absolute inset-0 z-[35] flex items-center justify-center px-[5%] py-[max(1rem,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kepi-stage-brief-title"
    >
      <div className="kepi-stage-brief-overlay__scrim absolute inset-0" aria-hidden />

      <div className="kepi-stage-brief-overlay__card relative w-full max-w-2xl">
        <StageBriefCard snapshot={snapshot} variant="overlay" />

        <div className="mt-2 flex justify-end border-t border-dashed border-amber-200/22 px-5 pb-5 pt-4 sm:px-7">
          <button
            type="button"
            className="kepi-campfire-continue"
            onClick={() => dismissStageBrief(state.currentNodeId, snapshot.board)}
          >
            <span>{stageBriefDismissCta(state.currentNodeId)}</span>
            <span className="kepi-campfire-continue__mark" aria-hidden>
              ›
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
