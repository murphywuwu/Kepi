"use client";

import { useCallback, useRef, useState } from "react";
import { usePointerGestureInput, type GestureIntent } from "@/lib/gesture";
import { cn } from "@/lib/utils";

export type GestureMode = "pointer" | "gesture";

type GestureLayerProps = {
  letterCount: number;
  caughtCount: number;
  onCatch: () => void;
  onSlowTime: () => void;
  gestureMode: GestureMode;
  disabled?: boolean;
  burnEnabled?: boolean;
  onBurnComplete?: () => void;
  /** Label on envelope buttons — 批 / 信 / 碎片 */
  fragmentLabel?: string;
};

export function GestureLayer({
  letterCount,
  caughtCount,
  onCatch,
  onSlowTime,
  gestureMode,
  disabled = false,
  burnEnabled = false,
  onBurnComplete,
  fragmentLabel = "批",
}: GestureLayerProps) {
  const targetIndexRef = useRef<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(0);
  const [burnedCount, setBurnedCount] = useState(0);
  const [hint, setHint] = useState<string>(
    gestureMode === "gesture"
      ? "左右滑动手势减速 · 点击接住信件"
      : "横滑拨开风浪 · 点击信件接住",
  );

  const catchTarget = useCallback(() => {
    const index = targetIndexRef.current ?? caughtCount;
    if (index < caughtCount || index >= letterCount) return;
    onCatch();
    setHint(`已接住 ${caughtCount + 1}/${letterCount} 封`);
  }, [caughtCount, letterCount, onCatch]);

  const handleIntent = useCallback(
    (intent: GestureIntent) => {
      if (disabled) return;
      if (intent.type === "SWIPE_LEFT" || intent.type === "SWIPE_RIGHT") {
        onSlowTime();
        setHint("子弹时间已触发 · 风浪被拨开");
        return;
      }
      if (intent.type === "GRAB") {
        catchTarget();
        return;
      }
      if (intent.type === "HOLD_START" && burnEnabled) {
        setHint("继续长按 · 信纸边缘开始发烫");
        return;
      }
      if (intent.type === "HOLD_PROGRESS" && burnEnabled && intent.progress) {
        if (intent.progress > 0.55) {
          setHint("火线正在吞没信纸");
        }
        return;
      }
      if (intent.type === "HOLD_COMPLETE" && burnEnabled) {
        setBurnedCount((prev) => Math.min(prev + 1, letterCount));
        setHint("信纸烧成灰烬");
        onBurnComplete?.();
      }
    },
    [
      burnEnabled,
      catchTarget,
      disabled,
      letterCount,
      onBurnComplete,
      onSlowTime,
    ],
  );

  const { bind, holdProgress, isHolding } = usePointerGestureInput({
    disabled,
    onIntent: handleIntent,
  });

  const setTarget = useCallback((index: number) => {
    targetIndexRef.current = index;
    setTargetIndex(index);
  }, []);

  const remaining = Math.max(0, letterCount - caughtCount);
  const canBurn = burnEnabled && remaining > 0;

  return (
    <div
      className={cn(
        "relative flex min-h-[240px] flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm",
        disabled ? "pointer-events-none opacity-60" : "cursor-pointer",
      )}
      {...bind}
      role="application"
      aria-label="结局手势交互层"
    >
      <p className="text-center text-sm text-amber-100/90">{hint}</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {Array.from({ length: letterCount }, (_, index) => {
          const caught = index < caughtCount;
          const burned = index < burnedCount;
          const targeted = targetIndex === index && !caught && !burned;
          return (
            <button
              key={index}
              type="button"
              disabled={disabled || caught || burned}
              onPointerEnter={() => setTarget(index)}
              onFocus={() => setTarget(index)}
              onPointerDown={() => setTarget(index)}
              className={cn(
                "relative h-14 w-10 overflow-hidden rounded-sm border text-xs transition-all",
                caught
                  ? "scale-95 border-amber-300/40 bg-amber-200/80 text-amber-950"
                  : burned
                    ? "scale-90 border-stone-500/40 bg-stone-900/70 text-stone-400"
                    : targeted
                      ? "scale-110 border-amber-200 bg-amber-100/35 text-amber-50 shadow-[0_0_30px_rgba(251,191,36,0.45)]"
                      : "animate-bounce border-amber-100/30 bg-amber-50/20 text-amber-50 hover:scale-105 hover:bg-amber-100/30",
              )}
              aria-label={
                caught
                  ? `第 ${index + 1} 封已接住`
                  : burned
                    ? `第 ${index + 1} 封已烧毁`
                    : `瞄准第 ${index + 1} 封客批`
              }
            >
              <span className="relative z-10">{burned ? "灰" : fragmentLabel}</span>
              {targeted && canBurn && isHolding ? (
                <span
                  className="absolute inset-x-0 bottom-0 bg-orange-500/70 transition-[height]"
                  style={{ height: `${Math.round(holdProgress * 100)}%` }}
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {canBurn ? (
        <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-amber-950/50">
          <div
            className="h-full rounded-full bg-orange-400 transition-[width]"
            style={{ width: `${Math.round(holdProgress * 100)}%` }}
            aria-hidden
          />
        </div>
      ) : null}

      <p className="text-xs text-amber-100/70">
        {gestureMode === "gesture"
          ? "摄像头手势不可用时将自动切换为指针操作"
          : "指针降级模式"}
        {" · "}
        剩余 {remaining} 封
        {canBurn ? " · 长按可烧信" : ""}
      </p>
    </div>
  );
}
