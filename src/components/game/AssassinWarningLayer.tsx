"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { isFinalBattleNode } from "@/lib/game/journeyBattleUi";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

const UI = ASSET_MANIFEST.ui;
const EFFECTS = ASSET_MANIFEST.effects;

export function AssassinWarningLayer() {
  const snapshot = useGameStore((state) => state.snapshot);
  const pushToast = useUIStore((state) => state.pushToast);
  const phase = snapshot.phase;
  const battle = snapshot.battle;
  const nodeId = snapshot.state.currentNodeId;

  const [leapFlash, setLeapFlash] = useState(false);
  const leapCountRef = useRef(0);

  const isFinal = isFinalBattleNode(nodeId);
  const active = phase === "battle" && Boolean(battle) && isFinal;

  const leapEvents =
    battle?.events.filter(
      (event) => event.type === "skill" && event.skillId === "assassin_leap",
    ).length ?? 0;

  useEffect(() => {
    if (!active || leapEvents <= leapCountRef.current) return;

    leapCountRef.current = leapEvents;
    setLeapFlash(true);
    pushToast("械斗火跃至后排 — 快护住水客！", "error");

    const timer = window.setTimeout(() => setLeapFlash(false), 720);
    return () => window.clearTimeout(timer);
  }, [active, leapEvents, pushToast]);

  useEffect(() => {
    if (phase !== "battle") {
      leapCountRef.current = 0;
      setLeapFlash(false);
    }
  }, [phase]);

  if (!active || !battle) return null;

  const showRing = battle.tick <= (isFinal ? 48 : 12) || leapFlash;

  if (!showRing && !leapFlash) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[18] overflow-hidden" aria-hidden>
      {showRing ? (
        <div className="kepi-assassin-ring-anchor absolute">
          <Image
            src={UI.textures.warningRingAssassin}
            alt=""
            width={168}
            height={168}
            className={cn(
              "kepi-assassin-warning-ring h-auto w-[min(34vw,10.5rem)] object-contain",
              leapFlash && "kepi-assassin-warning-ring--flash",
            )}
            priority
          />
        </div>
      ) : null}

      {leapFlash ? (
        <Image
          src={EFFECTS.assassinLeap}
          alt=""
          fill
          className="kepi-assassin-leap-flash object-cover mix-blend-screen opacity-90"
          sizes="100vw"
        />
      ) : null}
    </div>
  );
}
