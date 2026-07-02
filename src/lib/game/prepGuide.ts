import { ALLY_ROWS } from "@/lib/game/boardLayout";
import type { Piece } from "@/types";

export type PrepGuideStep = 1 | 2 | 3 | "done";

export const PREP_GUIDE_NODE_ID = "battle-2";

export function prepGuideEnabled(nodeId: string, step: PrepGuideStep): boolean {
  return nodeId === PREP_GUIDE_NODE_ID && step !== "done";
}

export function prepGuidePrompt(step: PrepGuideStep): string | null {
  switch (step) {
    case 1:
      return "从商店把水客招上场——他是收信的关键。";
    case 2:
      return "点选水客，放到后排格子，前排替他挡刀。";
    case 3:
      return "阵容就绪。确认水客在后排，然后开战。";
    default:
      return null;
  }
}

export function hasShuikeOnBoard(board: Piece[]): boolean {
  return board.some((piece) => piece.type === "shuike");
}

export function isShuikePlacedOnBackRow(board: Piece[]): boolean {
  const backRow = ALLY_ROWS[0]!;
  return board.some(
    (piece) => piece.type === "shuike" && piece.position?.y === backRow,
  );
}

export function resolvePrepGuideStep(board: Piece[]): PrepGuideStep {
  if (isShuikePlacedOnBackRow(board)) return 3;
  if (hasShuikeOnBoard(board)) return 2;
  return 1;
}

/** Advance guide step from board state; returns next step or unchanged. */
export function nextPrepGuideStepFromBoard(
  step: PrepGuideStep,
  board: Piece[],
): PrepGuideStep {
  if (step === "done") return "done";
  if (step === 1 && hasShuikeOnBoard(board)) return 2;
  if (step === 2 && isShuikePlacedOnBackRow(board)) return 3;
  return step;
}
