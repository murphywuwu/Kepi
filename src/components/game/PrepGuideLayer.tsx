"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { isPrepInteractive } from "@/lib/game/prepUi";
import {
  nextPrepGuideStepFromBoard,
  prepGuideEnabled,
  prepGuidePrompt,
  type PrepGuideStep,
} from "@/lib/game/prepGuide";
import { cn } from "@/lib/utils";

const STEP_LABELS: Record<1 | 2 | 3, string> = {
  1: "购水客",
  2: "落后排",
  3: "开战",
};

export function PrepGuideStepBar({ compact = false }: { compact?: boolean }) {
  const nodeId = useGameStore((state) => state.snapshot.state.currentNodeId);
  const prepGuideStep = useUIStore((state) => state.prepGuideStep);
  const prepSubview = useUIStore((state) => state.prepSubview);
  const skipPrepGuide = useUIStore((state) => state.skipPrepGuide);

  if (!isPrepInteractive(prepSubview) || !prepGuideEnabled(nodeId, prepGuideStep)) {
    return null;
  }

  if (compact) {
    return (
      <ol className="kepi-prep-guide-inline flex items-center gap-0.5" aria-label="首战斗引导">
        {([1, 2, 3] as const).map((step) => (
          <li
            key={step}
            className={cn(
              "kepi-prep-guide-dot h-2 w-2 rounded-full",
              prepGuideStep === step && "kepi-prep-guide-dot--active",
              typeof prepGuideStep === "number" && prepGuideStep > step && "kepi-prep-guide-dot--done",
            )}
            title={STEP_LABELS[step]}
          />
        ))}
      </ol>
    );
  }

  return (
    <div className="kepi-prep-guide-bar mb-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.6rem] font-bold tracking-wide text-kepi-ink-muted uppercase">
          首战斗引导
        </p>
        <button
          type="button"
          className="text-[0.6rem] text-kepi-ink-muted underline-offset-2 transition hover:text-kepi-ink hover:underline"
          onClick={skipPrepGuide}
        >
          我已熟悉
        </button>
      </div>
      <ol className="mt-1.5 flex items-center gap-1">
        {([1, 2, 3] as const).map((step) => (
          <li
            key={step}
            className={cn(
              "kepi-prep-guide-step flex-1 rounded-md px-2 py-1 text-center text-[0.58rem] font-medium",
              prepGuideStep === step && "kepi-prep-guide-step--active",
              typeof prepGuideStep === "number" && prepGuideStep > step && "kepi-prep-guide-step--done",
            )}
          >
            {STEP_LABELS[step]}
          </li>
        ))}
      </ol>
      <p className="mt-1.5 text-[0.6875rem] leading-snug text-kepi-ink-muted">
        {prepGuidePrompt(prepGuideStep)}
      </p>
    </div>
  );
}

export function PrepGuideLayer() {
  const phase = useGameStore((state) => state.snapshot.phase);
  const board = useGameStore((state) => state.snapshot.board);
  const nodeId = useGameStore((state) => state.snapshot.state.currentNodeId);
  const prepGuideStep = useUIStore((state) => state.prepGuideStep);
  const prepSubview = useUIStore((state) => state.prepSubview);
  const setPrepGuideStep = useUIStore((state) => state.setPrepGuideStep);

  useEffect(() => {
    if (phase !== "prep" || !isPrepInteractive(prepSubview)) return;
    if (!prepGuideEnabled(nodeId, prepGuideStep)) return;
    const next = nextPrepGuideStepFromBoard(prepGuideStep, board);
    if (next !== prepGuideStep) {
      setPrepGuideStep(next);
    }
  }, [phase, prepSubview, nodeId, prepGuideStep, board, setPrepGuideStep]);

  if (
    phase !== "prep" ||
    !isPrepInteractive(prepSubview) ||
    !prepGuideEnabled(nodeId, prepGuideStep)
  ) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[22]" aria-hidden>
      {prepGuideStep === 2 ? <BackRowHighlight /> : null}
    </div>
  );
}

function BackRowHighlight() {
  return (
    <div
      className="kepi-prep-guide-backrow pointer-events-none absolute"
      aria-hidden
    />
  );
}

export function prepGuideTargetClass(
  target: "buy-shuike" | "start-battle",
  currentStep: PrepGuideStep,
): string | undefined {
  if (currentStep === "done") return undefined;
  if (target === "buy-shuike" && currentStep === 1) return "kepi-prep-guide-target";
  if (target === "start-battle" && currentStep === 3) return "kepi-prep-guide-target";
  return undefined;
}
