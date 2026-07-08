"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HudBar } from "./HudBar";
import { JourneySideRail } from "./JourneySideRail";
import { PrepResourceStrip, PrepShopDock } from "./PrepDock";
import { BenchStrip } from "./ShopStrip";

type GameChromeProps = {
  prepActive: boolean;
  railDimmed?: boolean;
  railHidden?: boolean;
  children: ReactNode;
};

export function GameChrome({
  prepActive,
  railDimmed = false,
  railHidden = false,
  children,
}: GameChromeProps) {
  return (
    <div className={cn("kepi-game-chrome relative h-[100dvh] w-full overflow-hidden")}>
      <main className="kepi-chrome-stage kepi-scene-vignette">{children}</main>

      <header className="kepi-chrome-top">
        <HudBar embedded />
      </header>

      {!railHidden ? <JourneySideRail dimmed={railDimmed} /> : null}

      {prepActive ? (
        <>
          <div className="kepi-chrome-bench">
            <BenchStrip />
          </div>
          <div className="kepi-chrome-bottom">
            <PrepShopDock />
            <PrepResourceStrip />
          </div>
        </>
      ) : null}
    </div>
  );
}
