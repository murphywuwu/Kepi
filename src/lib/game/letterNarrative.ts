import type { ScenePhase, Piece, SettlementSummary } from "@/types";
import { journeyBattleBrief } from "./journeyBattleHints";
import { levelInteractionForNode } from "@/data/levelInteractions";

type LetterNarrativeInput = {
  phase: ScenePhase;
  stage: number;
  journeyIndex: number;
  currentNodeId: string;
  nextBattleEnemyHpFactor: number;
  kebi: number;
  kebiThreshold: number;
  board: Piece[];
  shuikeOnBoard: Piece[];
  xiangxianOnBoard: Piece[];
  winStreak: number;
  loseStreak: number;
  settlement?: SettlementSummary | null;
};

export function letterStripNeedsHint({
  stage,
  journeyIndex,
  board,
  shuikeOnBoard,
  xiangxianOnBoard,
}: Pick<
  LetterNarrativeInput,
  "stage" | "journeyIndex" | "board" | "shuikeOnBoard" | "xiangxianOnBoard"
>): boolean {
  if (journeyIndex === 1) return true;
  if (shuikeOnBoard.length === 0) return true;
  if (board.some((piece) => piece.type === "shuike" && piece.position === null)) return true;
  if (stage >= 2 && xiangxianOnBoard.length === 0) return true;
  if (stage >= 4) return true;
  return false;
}

export function letterStripNarrative(input: LetterNarrativeInput): string {
  const {
    phase,
    stage,
    journeyIndex,
    currentNodeId,
    nextBattleEnemyHpFactor,
    kebi,
    kebiThreshold,
    board,
    shuikeOnBoard,
    xiangxianOnBoard,
    winStreak,
    loseStreak,
    settlement,
  } = input;

  const interaction = levelInteractionForNode(currentNodeId);

  if (phase === "prep" && interaction) {
    if (shuikeOnBoard.length === 0) {
      return `${interaction.title}：水客未上场，先把水客招上场。${interaction.prep.objective}`;
    }
    if (board.some((piece) => piece.type === "shuike" && piece.position === null)) {
      return "水客已在备战队列，请点选后放到后排格子，前排棋子替他挡刀。";
    }
    if (nextBattleEnemyHpFactor < 1) {
      const pct = Math.round((1 - nextBattleEnemyHpFactor) * 100);
      return `夜话减益仍在：敌生命 -${pct}%。${interaction.prep.objective}`;
    }
    if (interaction.level >= 6 && kebi < kebiThreshold) {
      return `${interaction.title}：客批 ${kebi}/${kebiThreshold} 尚未达标。${interaction.prep.objective}`;
    }
    if (
      xiangxianOnBoard.length === 0 &&
      interaction.level >= 3 &&
      interaction.level <= 5
    ) {
      return `${interaction.title}压力上升，可招乡贤上场，让桑梓修缮家园更高效。`;
    }
    return `${interaction.prep.objective} ${interaction.mechanic.battleHint}`;
  }

  if (phase === "settlement" && settlement && interaction?.level === 7) {
    if (!settlement.won) {
      return "终局失利，信未抵家。若存续仍在，还可重整再战这一战。";
    }
    if (kebi >= kebiThreshold && settlement.waterGuestSurvived) {
      return "终局险胜，客批达标。确认后将踏入结局，查验归乡判定。";
    }
    if (!settlement.waterGuestSurvived) {
      return "终局虽胜，水客未能护信——结局仍将到来，但恐难完美归乡。";
    }
    return `终局已过，客批 ${kebi}/${kebiThreshold}。确认后进入结局演出。`;
  }

  if (phase === "settlement" && settlement) {
    if (!settlement.won) {
      return interaction?.settlement.loss ?? "本关失利，信未抵家。下一战须护住水客与存续。";
    }
    if (!settlement.waterGuestSurvived) {
      return interaction?.settlement.winNoLetter ??
        (settlement.waterGuestDeployed
          ? "胜局成立，但水客未能护信，本回合无客批与桑梓。"
          : "胜局成立，但水客未上场，本回合无客批与桑梓。");
    }
    if (settlement.sangziGained > 0) {
      return `${interaction?.settlement.win ?? "水客护信成功"} 桑梓 +${settlement.sangziGained}。`;
    }
    return "胜局收信，桑梓已汇入家园修缮。";
  }

  if (shuikeOnBoard.length === 0) {
    return "水客未上场——胜局也收不到客批，请从商店招募并落位。";
  }

  if (board.some((piece) => piece.type === "shuike" && piece.position === null)) {
    return "水客在备战队列，请落位后排，胜局方能收信。";
  }

  if (interaction?.level === 7) {
    return "械斗火会直扑后排，前排筑墙、紧邻水客布防。";
  }

  if (xiangxianOnBoard.length === 0 && stage >= 2) {
    return "可招募乡贤上场，让桑梓修缮家园更高效。";
  }

  if (loseStreak >= 2) {
    return `连败 ${loseStreak} 场，存续吃紧，下一战优先保水客与前排。`;
  }

  if (winStreak >= 2) {
    return `连胜 ${winStreak} 场，势头正旺，别忘了护好后排水客。`;
  }

  const brief = journeyBattleBrief(currentNodeId);
  if (phase === "prep" && brief) {
    return brief.prepBody;
  }

  return "桑梓修家园，水客护侨批，乡贤助修缮。";
}
