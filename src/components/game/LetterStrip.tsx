"use client";

import { useLayoutEffect } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import {
  letterStripNeedsHint,
  letterStripNarrative,
} from "@/lib/game/letterNarrative";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { GameIcon, WoodButton, WoodPanel } from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;

export function LetterStrip() {
  const snapshot = useGameStore((state) => state.snapshot);
  const expanded = useUIStore((state) => state.letterStripExpanded);
  const setExpanded = useUIStore((state) => state.setLetterStripExpanded);
  const { state, board, phase } = snapshot;
  const settlement = snapshot.settlement;

  if (phase === "ending" || phase === "settings") return null;

  const shuikeOnBoard = board.filter((piece) => piece.type === "shuike");
  const xiangxianOnBoard = board.filter((piece) => piece.type === "xiangxian");
  const needsHint = letterStripNeedsHint({
    stage: state.stage,
    board,
    shuikeOnBoard,
    xiangxianOnBoard,
  });
  const narrative = letterStripNarrative({
    phase,
    stage: state.stage,
    board,
    shuikeOnBoard,
    xiangxianOnBoard,
    winStreak: state.winStreak,
    loseStreak: state.loseStreak,
    settlement,
  });
  const kebiReady = state.kebi >= state.kebiThreshold;

  useLayoutEffect(() => {
    if (needsHint) setExpanded(true);
  }, [needsHint, setExpanded]);

  return (
    <div className="pointer-events-auto mx-auto w-full max-w-5xl">
      <WoodPanel
        className={cn(
          "kepi-letter-strip transition-[filter]",
          expanded && "kepi-letter-strip-expanded",
          needsHint && "kepi-letter-strip--hint",
        )}
        innerClassName="px-3 py-2"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-kepi-ink">
            <GameIcon src={UI.homewardTicket} size={16} />
            战况信笺
          </span>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.6875rem] tabular-nums text-kepi-ink-muted">
            <StripMetric
              icon={UI.kebi}
              label="客批"
              value={`${state.kebi}/${state.kebiThreshold}`}
              highlight={kebiReady}
            />
            <StripMetric icon={UI.gold} label="金币" value={String(state.gold)} />
            <StripMetric
              icon={UI.survival}
              label="存续"
              value={String(state.survival)}
              highlight={state.survival <= 1}
              warn={state.survival <= 1}
            />
            <StripMetric
              icon={UI.homeRepair}
              label="修复"
              value={`${state.homeRepair}%`}
            />
            <StripMetric
              icon={UI.shop}
              label="关卡"
              value={`${state.stage}/${state.totalStages}`}
            />
          </div>

          <WoodButton
            className="shrink-0 px-2 py-1 text-[0.65rem]"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? "收起后援详情" : "展开后援详情"}
          >
            后援 {expanded ? "▴" : "▾"}
          </WoodButton>
        </div>

        <p
          className={cn(
            "mt-1.5 text-xs leading-snug",
            needsHint ? "font-medium text-amber-800" : "text-kepi-ink-muted",
          )}
          role="status"
        >
          {narrative}
        </p>

        {expanded ? (
          <>
            <div className="kepi-wood-divider my-2.5" />
            <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-kepi-ink-muted">
              <span className="inline-flex items-center gap-1 tabular-nums">
                <GameIcon src={UI.sangzi} size={14} />
                桑梓 {state.sangzi}
              </span>
              <span className="tabular-nums">
                连胜 {state.winStreak} · 连败 {state.loseStreak}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <LogisticsCard
                icon={ASSET_MANIFEST.characters.shuike}
                name="水客"
                count={shuikeOnBoard.length}
                description={
                  shuikeOnBoard.length > 0
                    ? "须上场并存活，胜利后才收信"
                    : "未上场 — 胜局也拿不到客批"
                }
                critical
              />
              <LogisticsCard
                icon={ASSET_MANIFEST.characters.xiangxian}
                name="乡贤"
                count={xiangxianOnBoard.length}
                description={
                  xiangxianOnBoard.length > 0
                    ? "在场时桑梓→修复 +50%"
                    : "可招募上场，提升修缮效率"
                }
              />
            </div>
          </>
        ) : null}
      </WoodPanel>
    </div>
  );
}

function StripMetric({
  icon,
  label,
  value,
  highlight = false,
  warn = false,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        highlight && "font-semibold text-kepi-accent",
        warn && !highlight && "font-semibold text-amber-800",
        !highlight && !warn && "text-kepi-ink-muted",
      )}
    >
      <GameIcon src={icon} size={14} className="shrink-0 opacity-90" />
      <span className="text-kepi-ink/75">{label}</span>
      <span className="text-kepi-ink">{value}</span>
    </span>
  );
}

function LogisticsCard({
  icon,
  name,
  count,
  description,
  critical = false,
}: {
  icon: string;
  name: string;
  count: number;
  description: string;
  critical?: boolean;
}) {
  return (
    <div
      className={cn(
        "kepi-letter-support-card",
        critical && count === 0 && "kepi-letter-support-card--alert",
      )}
    >
      <GameIcon src={icon} size={28} />
      <div className="min-w-0">
        <p className="text-xs font-medium text-kepi-ink">
          {name}
          {count > 0 ? ` ×${count}` : " · 未上场"}
        </p>
        <p className="text-[0.625rem] leading-snug text-kepi-ink-muted">{description}</p>
      </div>
    </div>
  );
}
