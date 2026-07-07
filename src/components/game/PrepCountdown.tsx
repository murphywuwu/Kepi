"use client";

import { useEffect, useRef, useState } from "react";
import { BALANCE } from "@/data";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { isPrepInteractive } from "@/lib/game/prepUi";
import { cn } from "@/lib/utils";

const PREP_TIMEOUT_MS = BALANCE.battle.prepTimeSec * 1000;

/** Compact countdown badge shown next to the settings button during prep. */
export function PrepCountdown() {
  const phase = useGameStore((s) => s.snapshot.phase);
  const journeyIndex = useGameStore((s) => s.snapshot.state.journeyIndex);
  const prepSubview = useUIStore((s) => s.prepSubview);

  const active = phase === "prep" && isPrepInteractive(prepSubview);

  const [remainingMs, setRemainingMs] = useState(PREP_TIMEOUT_MS);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    startRef.current = performance.now();
    setRemainingMs(PREP_TIMEOUT_MS);

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const remaining = Math.max(0, PREP_TIMEOUT_MS - elapsed);
      setRemainingMs(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, journeyIndex]);

  if (!active) return null;

  const remainingSec = Math.ceil(remainingMs / 1000);
  const progress = remainingMs / PREP_TIMEOUT_MS;

  const isDanger = remainingSec <= 5;
  const isWarning = remainingSec <= 10 && !isDanger;

  const size = 40;
  const stroke = 2.5;
  const radius = size / 2 - stroke / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const ringColor = isDanger ? "#c1121f" : isWarning ? "#f6c177" : "#d4a574";

  return (
    <div
      className={cn(
        "kepi-prep-cd relative",
        isDanger && "kepi-prep-cd--pulse",
        isWarning && !isDanger && "kepi-prep-cd--warn",
      )}
      style={{ width: size, height: size }}
      title={`自动开战倒计时 · 剩余 ${remainingSec} 秒`}
    >
      <div className="kepi-prep-cd-bg absolute inset-0 rounded-full" />
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0, 0, 0, 0.18)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke 0.3s ease" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[0.8125rem] font-bold tabular-nums"
        style={{ color: "#f5ead6", textShadow: "0 1px 0 rgba(0,0,0,0.32)" }}
      >
        {remainingSec}
      </span>
    </div>
  );
}
