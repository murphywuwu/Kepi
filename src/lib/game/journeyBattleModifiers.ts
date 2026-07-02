import { journeyNodeById } from "@/data/journey";
import { BALANCE } from "@/data/balance";
import { levelInteractionForNode } from "@/data/levelInteractions";
import type { GameState } from "@/types";

export type PrepBattleModifier = {
  id: string;
  label: string;
  tone: "warning" | "buff" | "info";
};

export function prepBattleModifiers(state: GameState): PrepBattleModifier[] {
  const node = journeyNodeById(state.currentNodeId);
  const interaction = levelInteractionForNode(state.currentNodeId);
  const modifiers: PrepBattleModifier[] = [];

  if (node?.scalingOverride && node.scalingOverride > 1) {
    modifiers.push({
      id: "scaling",
      label: `敌情强化 ×${node.scalingOverride}`,
      tone: "warning",
    });
  }

  if (interaction && interaction.level >= 4) {
    modifiers.push({
      id: interaction.mechanic.id,
      label: interaction.level >= 7
        ? "械斗火 · 跃后排锁水客"
        : `${interaction.mechanic.label} · ${interaction.shortTitle}`,
      tone: "warning",
    });
  }

  if (node?.isFinal) {
    modifiers.push({
      id: "ending-gate",
      label: `胜后判定：客批 ≥ ${state.kebiThreshold}`,
      tone: "info",
    });
  }

  if (state.nextBattleEnemyHpFactor < 1) {
    const pct = Math.round((1 - state.nextBattleEnemyHpFactor) * 100);
    modifiers.push({
      id: "camp-debuff",
      label: `夜话减益：敌生命 -${pct}%`,
      tone: "buff",
    });
  }

  modifiers.push({
    id: "leaf-fall",
    label: `4 人客家宗族 → 落叶归根（${Math.round(BALANCE.clanSynergy.leafFall.durationMs / 1000)}s）`,
    tone: "info",
  });

  return modifiers;
}

export function hakkaClanCountOnBoard(
  board: ReadonlyArray<{ clan?: string | null }>,
): number {
  return board.filter((piece) => piece.clan === "hakka").length;
}

export function leafFallReadyHint(hakkaCount: number): string | null {
  const need = BALANCE.clanSynergy.leafFall.minClanCount;
  if (hakkaCount >= need) {
    return "落叶归根已就绪 — 开战即触发宗族大招";
  }
  if (hakkaCount === need - 1) {
    return "再补 1 名客家棋子，开战可触发落叶归根";
  }
  return null;
}
