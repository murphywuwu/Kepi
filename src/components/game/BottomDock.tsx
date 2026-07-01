"use client";

import { useGameStore } from "@/store/gameStore";
import { useBottomDockHeight } from "./useBottomDockHeight";
import { LetterStrip } from "./LetterStrip";
import { ShopPanel } from "./ShopStrip";

export function BottomDock() {
  const phase = useGameStore((state) => state.snapshot.phase);
  const dockRef = useBottomDockHeight();

  if (phase === "ending" || phase === "settings") return null;

  return (
    <div
      ref={dockRef}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1.5 px-[5%] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {phase === "prep" || phase === "settlement" ? <LetterStrip /> : null}
      {phase === "prep" ? <ShopPanel /> : null}
    </div>
  );
}
