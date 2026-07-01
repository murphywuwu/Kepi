"use client";

import {
  ARCHIVAL_LETTERS,
  ENDING_SCENE_COPY,
  endingLetterCount,
  endingSubtitle,
  type EndingNarrativeContext,
} from "@/data/letters";
import { requestDigitalLetters } from "@/lib/ai/client";
import type { AILetterResponse, AIPromptInput } from "@/lib/ai/types";
import { cn } from "@/lib/utils";
import type { EndingType } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WoodButton } from "@/components/game/ui";
import { GestureLayer, type GestureMode } from "./GestureLayer";
import {
  DigitalLetterCard,
  LetterPicker,
  LetterViewer,
} from "./LetterViewer";
import { useEndingAudio } from "./useEndingAudio";

export type EndingSceneProps = {
  endingType: EndingType;
  narrative: EndingNarrativeContext;
  stage: number;
  battleSummary?: string;
  gestureMode?: GestureMode;
  volume?: number;
  onComplete?: () => void;
  className?: string;
};

type EndingStep = "storm" | "catch" | "reading" | "finale";

export function EndingScene({
  endingType,
  narrative,
  stage,
  battleSummary,
  gestureMode = "pointer",
  volume = 0.8,
  onComplete,
  className,
}: EndingSceneProps) {
  const [step, setStep] = useState<EndingStep>("storm");
  const [caughtCount, setCaughtCount] = useState(0);
  const [slowTime, setSlowTime] = useState(false);
  const [selectedLetterIndex, setSelectedLetterIndex] = useState(0);
  const [digitalLetters, setDigitalLetters] = useState<AILetterResponse[]>([]);
  const [loadingDigital, setLoadingDigital] = useState(true);

  const copy = ENDING_SCENE_COPY[endingType];
  const letterCount = endingLetterCount(endingType, narrative);
  const archivalLetters = useMemo(
    () => ARCHIVAL_LETTERS.slice(0, letterCount),
    [letterCount],
  );

  const aiResult =
    endingType === "perfect_homecoming"
      ? "win"
      : endingType === "regretful_stay"
        ? "lose"
        : "lose";

  const aiInput: AIPromptInput = useMemo(
    () => ({
      stage,
      kebi: narrative.kebi,
      homeRepair: narrative.homeRepairTier * 33,
      survival: endingType === "storm_rescue" ? 0 : 1,
      battleSummary:
        battleSummary ??
        `第 ${stage} 关 · 客批 ${narrative.kebi}/${narrative.kebiThreshold}`,
      result: aiResult,
    }),
    [stage, narrative, battleSummary, aiResult, endingType],
  );

  const { playStorm, playOpen, playVoice, stopAll } = useEndingAudio({
    enabled: true,
    volume,
  });

  useEffect(() => {
    playStorm();
  }, [playStorm]);

  useEffect(() => {
    let cancelled = false;

    async function loadDigitalLetters() {
      setLoadingDigital(true);
      const count = Math.max(1, Math.min(narrative.kebi, 3));
      const results = await requestDigitalLetters(aiInput, count);
      if (!cancelled) {
        setDigitalLetters(results.map((item) => item.letter));
        setLoadingDigital(false);
      }
    }

    void loadDigitalLetters();
    return () => {
      cancelled = true;
    };
  }, [aiInput, narrative.kebi]);

  const handleCatch = useCallback(() => {
    setCaughtCount((prev) => {
      const next = Math.min(prev + 1, letterCount);
      if (next >= letterCount) {
        setStep("reading");
        playOpen();
        playVoice(archivalLetters[0]!);
      }
      return next;
    });
  }, [letterCount, archivalLetters, playOpen, playVoice]);

  const handleSelectLetter = useCallback(
    (index: number) => {
      setSelectedLetterIndex(index);
      playOpen();
      playVoice(archivalLetters[index]!);
    },
    [archivalLetters, playOpen, playVoice],
  );

  const fragmentLabel =
    endingType === "storm_rescue" ? "碎片" : endingType === "regretful_stay" ? "信" : "批";

  return (
    <section
      className={cn(
        "kepi-ending-scene relative min-h-full overflow-y-auto text-amber-50",
        copy.sceneClass,
        className,
      )}
      data-ending-type={endingType}
      aria-label="结局过场"
    >
      <div className="relative z-10 flex flex-col gap-6 p-6 md:p-10">
        <header className="space-y-2 text-center">
          <p className="text-xs tracking-[0.35em] text-amber-200/70 uppercase">
            {copy.badge}
          </p>
          <h1 className="font-heading text-3xl font-bold md:text-4xl">{copy.title}</h1>
          <p className="mx-auto max-w-2xl text-sm text-amber-100/80">{copy.intro}</p>
          {narrative.pawnedKebi > 0 ? (
            <p className="text-xs text-amber-200/60">
              本局曾典当 {narrative.pawnedKebi} 封客批 · 土楼庇护 {narrative.homeRepairTier} 阶
            </p>
          ) : null}
        </header>

        {step === "storm" || step === "catch" ? (
          <div className="space-y-4">
            <GestureLayer
              letterCount={letterCount}
              caughtCount={caughtCount}
              onCatch={handleCatch}
              onSlowTime={() => setSlowTime(true)}
              gestureMode={gestureMode}
              fragmentLabel={fragmentLabel}
            />
            {slowTime ? (
              <p className="text-center text-xs text-amber-200/80">
                子弹时间 · 信件飘落变慢
              </p>
            ) : null}
            {caughtCount >= letterCount ? (
              <div className="flex justify-center">
                <WoodButton
                  variant="primary"
                  className="px-5 py-2.5 text-sm"
                  onClick={() => setStep("reading")}
                >
                  开信阅读
                </WoodButton>
              </div>
            ) : (
              <div className="flex justify-center">
                <WoodButton
                  className="px-5 py-2.5 text-sm"
                  onClick={() => setStep("reading")}
                >
                  跳过接信，直接阅读
                </WoodButton>
              </div>
            )}
          </div>
        ) : null}

        {step === "reading" || step === "finale" ? (
          <div className="space-y-6">
            <LetterPicker
              letters={archivalLetters}
              selectedIndex={selectedLetterIndex}
              onSelect={handleSelectLetter}
            />
            <LetterViewer letter={archivalLetters[selectedLetterIndex]!} />

            <div className="space-y-3">
              <h2 className="text-center text-sm font-medium text-amber-100">
                沿途数字客批
                {loadingDigital ? "（加载中…）" : null}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {digitalLetters.map((letter, index) => (
                  <DigitalLetterCard
                    key={`${letter.title}-${index}`}
                    title={letter.title}
                    body={letter.body}
                    source={letter.source}
                    fromAI={letter.source === "AI 生成"}
                  />
                ))}
              </div>
            </div>

            {step === "reading" ? (
              <div className="flex justify-center">
                <WoodButton
                  variant="primary"
                  className="px-5 py-2.5 text-sm"
                  onClick={() => setStep("finale")}
                >
                  进入收尾字幕
                </WoodButton>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === "finale" ? (
          <footer className="space-y-4 text-center">
            <p className="mx-auto max-w-2xl rounded-lg bg-black/35 px-4 py-3 text-sm leading-relaxed text-amber-50/95">
              {endingSubtitle(endingType, narrative)}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {onComplete ? (
                <WoodButton
                  variant="primary"
                  className="px-5 py-2.5 text-sm"
                  onClick={() => {
                    stopAll();
                    onComplete();
                  }}
                >
                  重新开始
                </WoodButton>
              ) : null}
              <WoodButton
                className="px-5 py-2.5 text-sm"
                onClick={() => {
                  setStep("reading");
                  setSelectedLetterIndex(0);
                }}
              >
                重读侨批
              </WoodButton>
            </div>
          </footer>
        ) : null}
      </div>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,220,160,0.18),transparent_55%)]",
          slowTime ? "animate-pulse" : "",
          endingType === "perfect_homecoming"
            ? "bg-[radial-gradient(circle_at_50%_80%,rgba(255,200,120,0.28),transparent_60%)]"
            : "",
        )}
      />
      <div aria-hidden className="kepi-ending-vignette pointer-events-none absolute inset-0" />
      {endingType === "perfect_homecoming" ? (
        <div
          aria-hidden
          className="kepi-ending-lanterns pointer-events-none absolute inset-0"
        />
      ) : null}
      {endingType === "storm_rescue" ? (
        <div
          aria-hidden
          className="kepi-ending-wave-foreground pointer-events-none absolute inset-0"
        />
      ) : null}
    </section>
  );
}
