"use client";

import { ASSET_MANIFEST } from "@/data/assets";
import { ENEMIES } from "@/data/enemies";
import {
  levelInteractionForNode,
  levelToneClass,
  type StageBriefSupportCard,
  type StageBriefSupportFocus,
} from "@/data/levelInteractions";
import { ENEMY_VISUALS, PIECE_VISUALS } from "@/lib/game/assets";
import {
  hakkaClanCountOnBoard,
  leafFallReadyHint,
  prepBattleModifiers,
} from "@/lib/game/journeyBattleModifiers";
import { journeyBattleBrief } from "@/lib/game/journeyBattleHints";
import type { GameSnapshot } from "@/types";
import { cn } from "@/lib/utils";
import { GameIcon } from "@/components/game/ui";

type StageBriefCardProps = {
  snapshot: GameSnapshot;
  variant?: "overlay" | "inline";
};

export function stageBriefDismissCta(nodeId: string | undefined): string {
  const interaction = levelInteractionForNode(nodeId);
  return interaction?.stageBrief?.dismissCta ?? "进入备战";
}

export function StageBriefCard({ snapshot, variant = "overlay" }: StageBriefCardProps) {
  const { state, board } = snapshot;
  const brief = journeyBattleBrief(state.currentNodeId);
  const interaction = levelInteractionForNode(state.currentNodeId);
  if (!brief || !interaction) return null;

  const isOverlay = variant === "overlay";

  if (interaction.stageBrief) {
    return (
      <SupportFocusStageBrief
        brief={brief}
        interaction={interaction}
        stageBrief={interaction.stageBrief}
        isOverlay={isOverlay}
      />
    );
  }

  return (
    <ClassicStageBrief
      brief={brief}
      interaction={interaction}
      state={state}
      board={board}
      isOverlay={isOverlay}
    />
  );
}

function SupportFocusStageBrief({
  brief,
  interaction,
  stageBrief,
  isOverlay,
}: {
  brief: NonNullable<ReturnType<typeof journeyBattleBrief>>;
  interaction: NonNullable<ReturnType<typeof levelInteractionForNode>>;
  stageBrief: StageBriefSupportFocus;
  isOverlay: boolean;
}) {
  return (
    <div
      className={cn(
        isOverlay && "kepi-stage-brief-card kepi-campfire-narrative px-5 py-6 sm:px-7 sm:py-8",
        !isOverlay && "px-3 py-2.5 sm:px-4",
        levelToneClass(interaction.tone),
      )}
    >
      <div className="kepi-campfire-beat-header">
        <p className="text-[0.65rem] font-medium tracking-[0.2em] text-amber-200/80">
          归途 · 第 {interaction.level} 关
        </p>
        <h2
          id="kepi-stage-brief-title"
          className="mt-2 text-xl font-bold text-amber-50 sm:text-2xl"
        >
          {brief.prepTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-50/84">{interaction.tagline}</p>
        <div className="mt-2">
          <span
            className={cn(
              "kepi-prep-difficulty rounded-full px-2 py-0.5 text-[0.6rem] font-semibold tracking-wide",
              brief.difficultyLabel === "教学" && "kepi-prep-difficulty--tutorial",
            )}
          >
            {brief.difficultyLabel}
          </span>
        </div>
      </div>

      <div className="kepi-stage-brief-support-grid mt-5 grid gap-3 sm:grid-cols-2">
        <SupportBriefCard
          variant="shuike"
          portrait={PIECE_VISUALS.shuike.portrait}
          card={stageBrief.shuike}
        />
        <SupportBriefCard
          variant="xiangyin"
          portrait={ASSET_MANIFEST.ui.openingNote}
          card={stageBrief.xiangyin}
        />
      </div>

      <div className="kepi-stage-brief-enemy-row mt-5 rounded-md border border-amber-200/16 bg-black/16 px-3 py-2.5">
        <p className="text-[0.72rem] font-semibold leading-relaxed text-amber-100/92">
          {stageBrief.enemyLine}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-amber-50/76">{brief.prepBody}</p>
      </div>

      <p className="kepi-stage-brief-footnote mt-4 text-[0.65rem] leading-relaxed text-amber-200/62">
        {stageBrief.footnote}
      </p>
    </div>
  );
}

function SupportBriefCard({
  variant,
  portrait,
  card,
}: {
  variant: "shuike" | "xiangyin";
  portrait: string;
  card: StageBriefSupportCard;
}) {
  return (
    <div
      className={cn(
        "kepi-stage-brief-support-card rounded-md border p-4",
        variant === "shuike" && "kepi-stage-brief-support-card--shuike",
        variant === "xiangyin" && "kepi-stage-brief-support-card--xiangyin",
      )}
    >
      <div
        className={cn(
          "flex gap-3.5",
          variant === "shuike" && "flex-col items-center text-center sm:flex-row sm:items-start sm:text-left",
          variant === "xiangyin" && "items-start",
        )}
      >
        <div
          className={cn(
            "kepi-stage-brief-support-card__portrait shrink-0 overflow-hidden rounded-md border border-amber-200/18 bg-black/24",
            variant === "shuike" && "kepi-stage-brief-support-card__portrait--character",
            variant === "xiangyin" && "kepi-stage-brief-support-card__portrait--note",
          )}
        >
          {variant === "shuike" ? (
            <img
              src={portrait}
              alt="水客"
              className="kepi-stage-brief-support-card__sprite"
              draggable={false}
            />
          ) : (
            <GameIcon
              src={portrait}
              size={72}
              className="kepi-stage-brief-support-card__note-icon h-[4.5rem] w-[4.5rem] object-contain p-2"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-50 sm:text-base">{card.title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-50/78 sm:text-[0.8125rem]">
            {card.hint}
          </p>
        </div>
      </div>
      <ul className="mt-3.5 space-y-1.5 text-[0.7rem] leading-relaxed sm:text-xs">
        <li className="text-emerald-100/88">✓ {card.primaryNote}</li>
        <li className="text-amber-200/72">✗ {card.secondaryNote}</li>
      </ul>
    </div>
  );
}

function ClassicStageBrief({
  brief,
  interaction,
  state,
  board,
  isOverlay,
}: {
  brief: NonNullable<ReturnType<typeof journeyBattleBrief>>;
  interaction: NonNullable<ReturnType<typeof levelInteractionForNode>>;
  state: GameSnapshot["state"];
  board: GameSnapshot["board"];
  isOverlay: boolean;
}) {
  const enemy = ENEMY_VISUALS[brief.featuredEnemy];
  const modifiers = prepBattleModifiers(state);
  const leafHint = leafFallReadyHint(hakkaClanCountOnBoard(board));

  return (
    <div
      className={cn(
        isOverlay && "kepi-stage-brief-card kepi-campfire-narrative px-5 py-6 sm:px-7 sm:py-8",
        !isOverlay && "px-3 py-2.5 sm:px-4",
        levelToneClass(interaction.tone),
      )}
    >
      <div className="kepi-campfire-beat-header">
        <p className="text-[0.65rem] font-medium tracking-[0.2em] text-amber-200/80">
          归途 · 第 {interaction.level} 关
        </p>
        <h2
          id="kepi-stage-brief-title"
          className="mt-2 text-xl font-bold text-amber-50 sm:text-2xl"
        >
          {brief.prepTitle}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-amber-50/78">{interaction.tagline}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "kepi-prep-difficulty rounded-full px-2 py-0.5 text-[0.6rem] font-semibold tracking-wide",
              brief.difficultyLabel === "教学" && "kepi-prep-difficulty--tutorial",
              brief.difficultyLabel === "普通" && "kepi-prep-difficulty--normal",
              brief.difficultyLabel === "困难" && "kepi-prep-difficulty--hard",
              brief.difficultyLabel === "险峻" && "kepi-prep-difficulty--hard",
              brief.difficultyLabel === "极难" && "kepi-prep-difficulty--extreme",
            )}
          >
            {brief.difficultyLabel}
          </span>
          <span className="text-[0.625rem] font-medium tracking-[0.12em] text-amber-200/72">
            劲敌 · {ENEMIES[brief.featuredEnemy].name}
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-amber-200/18 bg-black/18 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-amber-200/20 bg-amber-50/10 px-2 py-0.5 text-[0.58rem] font-semibold tracking-[0.16em] text-amber-100">
            {interaction.opening.actName}
          </span>
          <span className="text-[0.625rem] text-amber-100/72">{interaction.opening.cta}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-amber-50/82">{interaction.opening.body}</p>
      </div>

      <div className="mt-5 flex items-start gap-4">
        <div className="kepi-prep-enemy-portrait relative shrink-0 overflow-hidden rounded-md border border-amber-200/20 bg-black/20">
          <GameIcon
            src={enemy.portrait}
            size={72}
            className="h-[4.5rem] w-[4.5rem] object-cover object-bottom"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1">
            {modifiers.map((modifier) => (
              <span
                key={modifier.id}
                className={cn(
                  "kepi-prep-modifier rounded-full px-2 py-0.5 text-[0.58rem] font-medium",
                  modifier.tone === "warning" && "kepi-prep-modifier--warning",
                  modifier.tone === "buff" && "kepi-prep-modifier--buff",
                  modifier.tone === "info" && "kepi-prep-modifier--info",
                )}
              >
                {modifier.label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-amber-50/92 sm:text-base">
            {brief.prepBody}
          </p>
          {brief.prepObjective ? (
            <p className="mt-2 rounded-md border border-amber-200/16 bg-amber-50/8 px-2.5 py-2 text-[0.72rem] font-semibold leading-relaxed text-amber-100/92">
              {brief.prepObjective}
            </p>
          ) : null}
          {leafHint ? (
            <p className="mt-2 text-[0.6875rem] font-medium text-amber-200/85">{leafHint}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-md border border-amber-200/14 bg-black/14 p-3">
          <p className="text-[0.62rem] font-semibold tracking-[0.16em] text-amber-200/75">
            本关机制
          </p>
          <p className="mt-1 text-sm font-bold text-amber-50">{interaction.mechanic.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-50/76">
            {interaction.mechanic.description}
          </p>
          {interaction.mechanic.warning ? (
            <p className="mt-1.5 text-[0.68rem] leading-relaxed text-amber-200/85">
              {interaction.mechanic.warning}
            </p>
          ) : null}
        </div>
        <div className="rounded-md border border-amber-200/14 bg-black/14 p-3">
          <p className="text-[0.62rem] font-semibold tracking-[0.16em] text-amber-200/75">
            乡音符
          </p>
          <p className="mt-1 text-sm font-bold text-amber-50">{interaction.xiangyinBuff.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-50/76">
            {interaction.xiangyinBuff.description}
          </p>
          {(state.bloodDebtCount > 0 || state.kebi < state.kebiThreshold) &&
          interaction.level >= 6 ? (
            <p className="mt-1.5 text-[0.68rem] leading-relaxed text-amber-200/85">
              客批 {state.kebi}/{state.kebiThreshold} · 血债 {state.bloodDebtCount}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
