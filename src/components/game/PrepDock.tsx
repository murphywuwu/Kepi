"use client";

import { useEffect } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { isPrepInteractive } from "@/lib/game/prepUi";
import { prepGuideEnabled } from "@/lib/game/prepGuide";
import { cn } from "@/lib/utils";
import { GameIcon, WoodButton, WoodPanel } from "@/components/game/ui";
import { useBottomDockHeight } from "@/components/game/useBottomDockHeight";
import { PrepGuideStepBar } from "@/components/game/PrepGuideLayer";
import { ShopPanel } from "@/components/game/ShopStrip";

const UI = ASSET_MANIFEST.ui;

export function PrepDock() {
  const snapshot = useGameStore((state) => state.snapshot);
  const startBattle = useGameStore((state) => state.startBattle);
  const pushToast = useUIStore((state) => state.pushToast);
  const prepSubview = useUIStore((state) => state.prepSubview);
  const prepDockExpanded = useUIStore((state) => state.prepDockExpanded);
  const setPrepDockExpanded = useUIStore((state) => state.setPrepDockExpanded);
  const prepGuideStep = useUIStore((state) => state.prepGuideStep);
  const markPrepGuideDone = useUIStore((state) => state.markPrepGuideDone);
  const dockRef = useBottomDockHeight();
  const { phase, state, board } = snapshot;

  const prepActive = phase === "prep" && isPrepInteractive(prepSubview);
  const guideActive = prepGuideEnabled(state.currentNodeId, prepGuideStep);

  useEffect(() => {
    if (!prepActive || !guideActive || prepGuideStep !== 1) return;
    setPrepDockExpanded(true);
  }, [prepActive, guideActive, prepGuideStep, setPrepDockExpanded]);

  if (!prepActive) return null;

  const onStartBattle = () => {
    if (!startBattle()) {
      pushToast("请先购买棋子再开战", "error");
      return;
    }
    if (prepGuideStep === 3) {
      markPrepGuideDone();
    }
    pushToast("战斗开始", "default");
  };

  return (
    <div
      ref={dockRef}
      className={cn(
        "kepi-prep-dock pointer-events-none z-[20] shrink-0 px-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        prepDockExpanded && "kepi-prep-dock--expanded",
      )}
    >
      <WoodPanel
        className="kepi-prep-dock-panel pointer-events-auto mx-auto w-full max-w-6xl"
        innerClassName="p-0"
      >
        <div className="kepi-prep-dock-handle flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
          <button
            type="button"
            className="kepi-prep-dock-toggle inline-flex min-w-0 flex-1 items-center gap-2 text-left"
            onClick={() => setPrepDockExpanded(!prepDockExpanded)}
            aria-expanded={prepDockExpanded}
          >
            <GameIcon src={UI.shopRefresh} size={16} className="shrink-0 opacity-80" />
            <span className="text-xs font-bold text-kepi-ink">备军图</span>
            <span className="truncate text-[0.625rem] text-kepi-ink-muted">
              人口 {board.length}/{state.population}
              <span className="mx-1 opacity-40">·</span>
              金币 {state.gold}
            </span>
            <span className="ml-auto shrink-0 text-[0.625rem] text-kepi-ink-muted">
              {prepDockExpanded ? "收起 ▾" : "展开 ▴"}
            </span>
          </button>

          {!prepDockExpanded && guideActive ? (
            <PrepGuideStepBar compact />
          ) : null}

          {!prepDockExpanded ? (
            <WoodButton
              variant="primary"
              className="shrink-0 px-4 py-2 text-sm font-bold"
              onClick={onStartBattle}
            >
              <GameIcon src={UI.battleStart} size={18} />
              开战
            </WoodButton>
          ) : null}
        </div>

        {prepDockExpanded ? (
          <div className="kepi-prep-dock-body border-t border-dashed border-kepi-ink/12 px-3 pb-3 pt-2 sm:px-4">
            {guideActive ? <PrepGuideStepBar /> : null}
            <ShopPanel dock onStartBattle={onStartBattle} />
          </div>
        ) : null}
      </WoodPanel>
    </div>
  );
}
