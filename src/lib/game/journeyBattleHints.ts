import type { EnemyType } from "@/types";
import { levelInteractionForNode } from "@/data/levelInteractions";

export type JourneyBattleBrief = {
  featuredEnemy: EnemyType;
  prepTitle: string;
  prepBody: string;
  prepObjective?: string;
  battleHint: string;
  difficultyLabel: string;
  openingAct?: string;
  openingBody?: string;
  openingCta?: string;
  prepAct?: string;
  prepCta?: string;
  mechanicLabel?: string;
  mechanicDescription?: string;
  mechanicWarning?: string;
  xiangyinLabel?: string;
  xiangyinDescription?: string;
  settlementAct?: string;
  settlementCta?: string;
  settlementWin?: string;
  settlementWinNoLetter?: string;
  settlementLoss?: string;
  nextHook?: string;
  acceptance?: string;
};

export function journeyBattleBrief(nodeId: string | undefined): JourneyBattleBrief | null {
  const level = levelInteractionForNode(nodeId);
  if (!level) return null;

  return {
    featuredEnemy: level.featuredEnemy,
    prepTitle: level.title,
    prepBody: level.prep.body,
    prepObjective: level.prep.objective,
    battleHint: level.mechanic.battleHint,
    difficultyLabel: level.difficultyLabel,
    openingAct: level.opening.actName,
    openingBody: level.opening.body,
    openingCta: level.opening.cta,
    prepAct: level.prep.actName,
    prepCta: level.prep.cta,
    mechanicLabel: level.mechanic.label,
    mechanicDescription: level.mechanic.description,
    mechanicWarning: level.mechanic.warning,
    xiangyinLabel: level.xiangyinBuff.label,
    xiangyinDescription: level.xiangyinBuff.description,
    settlementAct: level.settlement.actName,
    settlementCta: level.settlement.cta,
    settlementWin: level.settlement.win,
    settlementWinNoLetter: level.settlement.winNoLetter,
    settlementLoss: level.settlement.loss,
    nextHook: level.settlement.nextHook,
    acceptance: level.acceptance,
  };
}
