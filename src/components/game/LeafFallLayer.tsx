"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { BALANCE } from "@/data/balance";
import { BATTLE_TICK_MS } from "@/engine/constants";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

const EFFECTS = ASSET_MANIFEST.effects;

export function LeafFallLayer() {
  const snapshot = useGameStore((state) => state.snapshot);
  const pushToast = useUIStore((state) => state.pushToast);
  const phase = snapshot.phase;
  const battle = snapshot.battle;

  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const wasTriggeredRef = useRef(false);

  const leafFall = battle?.leafFall;
  const elapsedMs = Math.max(
    battle?.elapsedMs ?? 0,
    (battle?.tick ?? 0) * BATTLE_TICK_MS,
  );
  const activeUntilMs = leafFall?.activeUntilMs ?? 0;
  const isActive =
    phase === "battle" &&
    Boolean(leafFall?.triggered) &&
    elapsedMs < activeUntilMs;

  useEffect(() => {
    if (!leafFall?.triggered) {
      wasTriggeredRef.current = false;
      return;
    }

    if (!wasTriggeredRef.current) {
      wasTriggeredRef.current = true;
      setVisible(true);
      setFading(false);
      pushToast("落叶归根 — 宗族大招发动！", "success");
    }
  }, [leafFall?.triggered, pushToast]);

  useEffect(() => {
    if (!visible || isActive) return;

    setFading(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      setFading(false);
    }, 680);

    return () => window.clearTimeout(timer);
  }, [visible, isActive]);

  useEffect(() => {
    if (phase !== "battle") {
      setVisible(false);
      setFading(false);
      wasTriggeredRef.current = false;
    }
  }, [phase]);

  if (!visible) return null;

  const durationSec = Math.round(BALANCE.clanSynergy.leafFall.durationMs / 1000);

  return (
    <div
      className={cn(
        "kepi-leaf-fall-layer pointer-events-none absolute inset-0 z-[25] overflow-hidden",
        fading && "kepi-leaf-fall-layer--fade-out",
      )}
      aria-live="polite"
      aria-label="落叶归根"
    >
      <Image
        src={EFFECTS.leafFallOverlay}
        alt=""
        fill
        className="object-cover opacity-90 mix-blend-screen"
        sizes="100vw"
        priority
      />
      <Image
        src={EFFECTS.leafFallLanterns}
        alt=""
        fill
        className="kepi-leaf-fall-lanterns object-cover opacity-75 mix-blend-screen"
        sizes="100vw"
      />
      <div className="absolute inset-x-0 top-[38%] flex flex-col items-center px-[8%] text-center">
        <p className="kepi-leaf-fall-title text-lg font-bold tracking-[0.2em] text-amber-50 sm:text-xl">
          落叶归根
        </p>
        <p className="mt-2 text-xs text-amber-100/88 sm:text-sm">
          攻速 +{Math.round(BALANCE.clanSynergy.leafFall.atkSpeedBonus * 100)}% · 吸血{" "}
          {Math.round(BALANCE.clanSynergy.leafFall.lifestealRatio * 100)}% · {durationSec}s
        </p>
      </div>
    </div>
  );
}
