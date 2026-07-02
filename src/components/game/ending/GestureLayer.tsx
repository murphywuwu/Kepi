"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import {
  ENDING_LETTER_FALL_SLOTS,
  endingCatchHint,
} from "@/lib/game/endingUi";
import { cn } from "@/lib/utils";
import { GameIcon } from "@/components/game/ui";

export type GestureMode = "pointer" | "gesture";

type GestureLayerProps = {
  letterCount: number;
  caughtCount: number;
  onCatch: () => void;
  onSlowTime: () => void;
  gestureMode: GestureMode;
  slowTime?: boolean;
  disabled?: boolean;
  /** Label on envelope buttons — 批 / 信 / 碎片 */
  fragmentLabel?: string;
};

const SWIPE_THRESHOLD = 48;
const ENDING = ASSET_MANIFEST.ending;

export function GestureLayer({
  letterCount,
  caughtCount,
  onCatch,
  onSlowTime,
  gestureMode,
  slowTime = false,
  disabled = false,
  fragmentLabel = "批",
}: GestureLayerProps) {
  const startX = useRef<number | null>(null);
  const [hint, setHint] = useState(() => endingCatchHint(gestureMode, slowTime));

  useEffect(() => {
    setHint(endingCatchHint(gestureMode, slowTime));
  }, [gestureMode, slowTime]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      startX.current = event.clientX;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [disabled],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || startX.current === null) return;
      const delta = event.clientX - startX.current;
      startX.current = null;

      if (Math.abs(delta) >= SWIPE_THRESHOLD) {
        onSlowTime();
        setHint(endingCatchHint(gestureMode, true));
      }
    },
    [disabled, gestureMode, onSlowTime],
  );

  const remaining = Math.max(0, letterCount - caughtCount);

  return (
    <div
      className={cn(
        "kepi-ending-catch-stage relative flex min-h-[min(52vh,22rem)] flex-col items-center justify-end gap-3 overflow-hidden rounded-xl border border-amber-100/15 p-4 pb-5 sm:p-6",
        disabled ? "pointer-events-none opacity-60" : "",
        slowTime && "kepi-ending-catch-stage--slow",
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      role="application"
      aria-label="结局手势交互层"
    >
      <Image
        src={ENDING.letterScatter}
        alt=""
        fill
        className="kepi-ending-scatter object-cover opacity-55 mix-blend-screen"
        sizes="(max-width: 768px) 100vw, 720px"
        priority
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/45" />

      {slowTime ? (
        <Image
          src={ENDING.bulletTime}
          alt=""
          fill
          className="kepi-ending-bullet-time object-cover mix-blend-screen opacity-80"
          sizes="(max-width: 768px) 100vw, 720px"
        />
      ) : null}

      <div className="relative z-[2] flex w-full flex-col items-center gap-2 pt-2">
        <GameIcon src={ENDING.gestureHint} size={36} className="opacity-90" />
        <p className="max-w-md text-center text-sm text-amber-50/95">{hint}</p>
      </div>

      <div className="relative z-[3] h-[min(34vh,11rem)] w-full max-w-2xl">
        {Array.from({ length: letterCount }, (_, index) => {
          const caught = index < caughtCount;
          const slot = ENDING_LETTER_FALL_SLOTS[index % ENDING_LETTER_FALL_SLOTS.length]!;

          if (caught) {
            return (
              <div
                key={index}
                className="kepi-ending-letter-caught absolute bottom-2"
                style={{ left: slot.left, transform: "translateX(-50%)" }}
              >
                <Image
                  src={ENDING.kebiLetterProp}
                  alt=""
                  width={56}
                  height={72}
                  className="h-auto w-10 object-contain opacity-85 sm:w-12"
                />
              </div>
            );
          }

          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => {
                onCatch();
                setHint(`已接住 ${caughtCount + 1}/${letterCount} 封`);
              }}
              className={cn(
                "kepi-ending-letter-fall absolute top-0 -translate-x-1/2 transition-transform",
                slowTime && "kepi-ending-letter-fall--slow",
              )}
              style={{
                left: slot.left,
                animationDelay: slot.delay,
                ["--kepi-letter-drift" as string]: slot.drift,
              }}
              aria-label={`接住第 ${index + 1} 封客批`}
            >
              <Image
                src={ENDING.kebiLetterProp}
                alt=""
                width={72}
                height={92}
                className="kepi-ending-letter-prop h-auto w-12 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] sm:w-14"
              />
              <span className="sr-only">{fragmentLabel}</span>
            </button>
          );
        })}
      </div>

      <p className="relative z-[2] text-xs text-amber-100/75">
        {gestureMode === "gesture" ? "手势模式" : "指针模式"}
        {" · "}
        剩余 {remaining} 封
      </p>
    </div>
  );
}
