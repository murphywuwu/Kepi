import type { GamePhase, Piece, SettlementSummary } from "@/types";

type LetterNarrativeInput = {
  phase: GamePhase;
  stage: number;
  board: Piece[];
  shuikeOnBoard: Piece[];
  xiangxianOnBoard: Piece[];
  winStreak: number;
  loseStreak: number;
  settlement?: SettlementSummary | null;
};

export function letterStripNeedsHint({
  stage,
  board,
  shuikeOnBoard,
  xiangxianOnBoard,
}: Pick<
  LetterNarrativeInput,
  "stage" | "board" | "shuikeOnBoard" | "xiangxianOnBoard"
>): boolean {
  if (shuikeOnBoard.length === 0) return true;
  if (board.some((piece) => piece.type === "shuike" && piece.position === null)) return true;
  if (stage >= 2 && xiangxianOnBoard.length === 0) return true;
  if (stage >= 4) return true;
  return false;
}

export function letterStripNarrative(input: LetterNarrativeInput): string {
  const { phase, stage, board, shuikeOnBoard, xiangxianOnBoard, winStreak, loseStreak, settlement } =
    input;

  if (phase === "settlement" && settlement) {
    if (!settlement.won) {
      return "本关失利，信未抵家。下一战须护住水客与存续。";
    }
    if (!settlement.waterGuestSurvived) {
      return settlement.waterGuestDeployed
        ? "胜局成立，但水客未能护信，本回合无客批与桑梓。"
        : "胜局成立，但水客未上场，本回合无客批与桑梓。";
    }
    if (settlement.sangziGained > 0) {
      return `水客护信成功，桑梓 +${settlement.sangziGained}，家园修缮推进中。`;
    }
    return "胜局收信，桑梓已汇入家园修缮。";
  }

  if (shuikeOnBoard.length === 0) {
    return "水客未上场——胜局也收不到客批，请从商店招募并落位。";
  }

  if (board.some((piece) => piece.type === "shuike" && piece.position === null)) {
    return "水客在备战队列，请落位后排，胜局方能收信。";
  }

  if (stage >= 4) {
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

  return "桑梓修家园，水客护侨批，乡贤助修缮。";
}
