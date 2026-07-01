"use client";

import { useEffect, type ReactNode } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { BATTLE_MAX_MS, BATTLE_TICK_MS } from "@/engine/constants";
import { homeRepairStageLabel } from "@/lib/game/assets";
import { duckBgm, restoreBgm } from "@/lib/audio/bgm";
import { useGameStore } from "@/store/gameStore";
import { GameIcon, WoodPanel } from "@/components/game/ui";
import { cn } from "@/lib/utils";

const UI = ASSET_MANIFEST.ui;

const TU_LOU_BUFF_LABELS: Record<0 | 1 | 2 | 3, string> = {
  0: "无庇护",
  1: "护盾 +20% HP",
  2: "护盾 + 攻速 +15%",
  3: "护盾 + 攻速 + 免死一次",
};

export function BattleHud() {
  const phase = useGameStore((state) => state.snapshot.phase);
  const gameState = useGameStore((state) => state.snapshot.state);
  const stage = gameState.stage;
  const homeRepair = gameState.homeRepair;
  const homeRepairTier = gameState.homeRepairTier;
  const battle = useGameStore((state) => state.snapshot.battle);

  if (phase !== "battle" || !battle) return null;

  const elapsedMs = Math.max(
    battle.elapsedMs,
    battle.tick * BATTLE_TICK_MS,
  );
  const remainingSec = Math.max(0, Math.ceil((BATTLE_MAX_MS - elapsedMs) / 1000));
  const tier = battle.tulouBuffs?.tier ?? homeRepairTier;
  const shuike = battle.allies.find((piece) => piece.id === battle.waterGuest.pieceId);
  const shuikeRatio =
    shuike && shuike.maxHp > 0 ? shuike.hp / shuike.maxHp : null;
  const crisisLevel =
    shuike && shuike.hp > 0 && shuikeRatio !== null
      ? shuikeRatio <= 0.3
        ? 2
        : shuikeRatio <= 0.5
          ? 1
          : 0
      : 0;

  const kebiReady = gameState.kebi >= gameState.kebiThreshold;

  return (
    <BattleHudEffects crisisLevel={crisisLevel}>
      <div className="pointer-events-none absolute inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex justify-center px-[5%] pr-[calc(5%+3rem)]">
        <WoodPanel
          className={cn(
            "pointer-events-auto w-full max-w-3xl transition-[filter,box-shadow]",
            crisisLevel === 2 && "kepi-battle-hud--crisis-high",
            crisisLevel === 1 && "kepi-battle-hud--crisis-mid",
          )}
          innerClassName="px-3 py-2"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] sm:gap-x-4 sm:text-xs">
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums">
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  kebiReady ? "font-semibold text-kepi-accent" : "text-kepi-ink-muted",
                )}
              >
                <GameIcon src={UI.kebi} size={14} />
                客批 {gameState.kebi}/{gameState.kebiThreshold}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  gameState.survival <= 1
                    ? "font-semibold text-amber-800"
                    : "text-kepi-ink-muted",
                )}
              >
                <GameIcon src={UI.survival} size={14} />
                存续 {gameState.survival}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 font-bold tabular-nums text-kepi-ink">
              剩余 {remainingSec}s
            </span>

            <WaterGuestStatus
              deployed={battle.waterGuest.deployed}
              died={battle.waterGuest.died}
              hp={shuike?.hp ?? 0}
              maxHp={shuike?.maxHp ?? 0}
              crisisLevel={crisisLevel}
            />

            <span className="inline-flex min-w-0 items-center gap-1.5 text-kepi-ink-muted">
              <GameIcon src={UI.homeRepair} size={14} />
              <span className="truncate">
                {TU_LOU_BUFF_LABELS[tier]} · {homeRepairStageLabel(homeRepair)}
              </span>
            </span>
          </div>

          {stage >= 4 && battle.tick <= 1 ? (
            <p className="mt-1.5 text-[0.625rem] leading-snug text-red-800 sm:text-[0.6875rem]">
              械斗火已跃至后排——围住水客，别让信沉了。
            </p>
          ) : null}
        </WoodPanel>
      </div>
    </BattleHudEffects>
  );
}

function WaterGuestStatus({
  deployed,
  died,
  hp,
  maxHp,
  crisisLevel,
}: {
  deployed: boolean;
  died: boolean;
  hp: number;
  maxHp: number;
  crisisLevel: 0 | 1 | 2;
}) {
  if (!deployed) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-amber-900">
        <GameIcon src={ASSET_MANIFEST.characters.shuike} size={14} />
        水客未上场
      </span>
    );
  }

  if (died || hp <= 0) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-red-800">
        <GameIcon src={ASSET_MANIFEST.characters.shuike} size={14} />
        水客已阵亡
      </span>
    );
  }

  const pct = maxHp > 0 ? Math.round((hp / maxHp) * 100) : 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium tabular-nums",
        crisisLevel === 2 && "text-red-800",
        crisisLevel === 1 && "text-amber-800",
        crisisLevel === 0 && "text-kepi-ink",
      )}
    >
      <GameIcon src={ASSET_MANIFEST.characters.shuike} size={14} />
      水客 {pct}%
    </span>
  );
}

function BattleHudEffects({
  crisisLevel,
  children,
}: {
  crisisLevel: 0 | 1 | 2;
  children: ReactNode;
}) {
  useEffect(() => {
    if (crisisLevel > 0) {
      duckBgm(crisisLevel === 2 ? 0.22 : 0.38);
      return () => restoreBgm();
    }
    restoreBgm();
    return undefined;
  }, [crisisLevel]);

  return (
    <>
      {crisisLevel > 0 ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-[15]",
            crisisLevel === 2 ? "kepi-global-crisis-high" : "kepi-global-crisis-mid",
          )}
          aria-hidden
        />
      ) : null}
      {children}
    </>
  );
}
