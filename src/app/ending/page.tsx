"use client";

import { EndingScene } from "@/components/game/ending";
import type { EndingNarrativeContext } from "@/data/letters";
import { buildEndingBattleSummary } from "@/data/letters";
import type { EndingType } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

const PRESETS: Record<
  EndingType,
  { narrative: EndingNarrativeContext; stage: number }
> = {
  perfect_homecoming: {
    stage: 4,
    narrative: {
      kebi: 4,
      kebiThreshold: 4,
      pawnedKebi: 0,
      homeRepairTier: 3,
      waterGuestSurvived: true,
      waterGuestDied: false,
    },
  },
  regretful_stay: {
    stage: 4,
    narrative: {
      kebi: 2,
      kebiThreshold: 4,
      pawnedKebi: 1,
      homeRepairTier: 2,
      waterGuestSurvived: true,
      waterGuestDied: false,
    },
  },
  storm_rescue: {
    stage: 2,
    narrative: {
      kebi: 1,
      kebiThreshold: 4,
      pawnedKebi: 0,
      homeRepairTier: 0,
      waterGuestSurvived: false,
      waterGuestDied: true,
    },
  },
};

export default function EndingPreviewPage() {
  const [variant, setVariant] = useState<EndingType>("perfect_homecoming");
  const preset = PRESETS[variant];

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">结局预览</h1>
          <p className="text-sm text-muted-foreground">
            V2.0 三结局：完美归乡、遗憾留守、风浪抢救 — 共享手势接信过场。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            data-testid="ending-variant-perfect"
            variant={variant === "perfect_homecoming" ? "default" : "outline"}
            onClick={() => setVariant("perfect_homecoming")}
          >
            完美归乡
          </Button>
          <Button
            data-testid="ending-variant-regret"
            variant={variant === "regretful_stay" ? "default" : "outline"}
            onClick={() => setVariant("regretful_stay")}
          >
            遗憾留守
          </Button>
          <Button
            data-testid="ending-variant-storm"
            variant={variant === "storm_rescue" ? "default" : "outline"}
            onClick={() => setVariant("storm_rescue")}
          >
            风浪抢救
          </Button>
          <Button nativeButton={false} variant="outline" render={<Link href="/debug" />}>
            调试页
          </Button>
        </div>
      </div>

      <EndingScene
        key={variant}
        endingType={variant}
        narrative={preset.narrative}
        stage={preset.stage}
        battleSummary={buildEndingBattleSummary(
          variant,
          preset.narrative,
          preset.stage,
        )}
        gestureMode="pointer"
        onComplete={() => setVariant(variant)}
      />
    </main>
  );
}
