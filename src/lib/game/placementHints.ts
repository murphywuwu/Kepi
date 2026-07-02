import {
  ALLY_ROWS,
  BOARD_COLS,
  type BoardMetrics,
} from "@/lib/game/boardLayout";
import type { BoardPosition, Piece } from "@/types";

export type PlacementHintKind = "attack" | "protect";

export type PlacementHint = {
  cell: BoardPosition;
  kind: PlacementHintKind;
};

const FRONT_ROW = ALLY_ROWS[ALLY_ROWS.length - 1]!;
const BACK_ROW = ALLY_ROWS[0]!;

function cellKey(cell: BoardPosition): string {
  return `${cell.x},${cell.y}`;
}

function shuikeOnBoard(allies: Piece[]): Piece | null {
  return allies.find((piece) => piece.type === "shuike" && piece.position) ?? null;
}

/** Green = front-line attack row; blue = back-row cells guarding water guest. */
export function prepPlacementHints(
  allies: Piece[],
  stage: number,
): PlacementHint[] {
  const hints: PlacementHint[] = [];

  for (let col = 0; col < BOARD_COLS; col += 1) {
    hints.push({ cell: { x: col, y: FRONT_ROW }, kind: "attack" });
  }

  if (stage < 5) return hints;

  const shuike = shuikeOnBoard(allies);
  if (!shuike?.position) return hints;

  const protectCells = new Set<string>();
  for (let col = 0; col < BOARD_COLS; col += 1) {
    const cell = { x: col, y: BACK_ROW };
    if (Math.abs(col - shuike.position.x) <= 1) {
      protectCells.add(cellKey(cell));
    }
  }
  protectCells.add(cellKey({ x: shuike.position.x, y: BACK_ROW }));

  for (const key of protectCells) {
    const [x, y] = key.split(",").map(Number);
    hints.push({ cell: { x: x!, y: y! }, kind: "protect" });
  }

  return hints;
}

export function shuikeAssassinWarningPosition(allies: Piece[]): BoardPosition | null {
  const shuike = shuikeOnBoard(allies);
  return shuike?.position ?? null;
}

export function hasAssassinThreat(stage: number): boolean {
  return stage >= 7;
}

export function drawPlacementHintRing(
  ctx: CanvasRenderingContext2D,
  cell: BoardPosition,
  metrics: BoardMetrics,
  kind: PlacementHintKind,
  alpha: number,
): void {
  const { originX, originY, cellSize } = metrics;
  const x = originX + (cell.x + 0.5) * cellSize;
  const y = originY + (cell.y + 0.5) * cellSize;
  const r = cellSize * 0.34;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = kind === "attack" ? "#6bcb77" : "#8ecae6";
  ctx.fillStyle =
    kind === "attack" ? "rgba(107, 203, 119, 0.12)" : "rgba(142, 202, 230, 0.14)";
  ctx.lineWidth = kind === "attack" ? 1.5 : 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawAssassinWarningRing(
  ctx: CanvasRenderingContext2D,
  position: BoardPosition,
  metrics: BoardMetrics,
  timeMs: number,
): void {
  const { originX, originY, cellSize } = metrics;
  const x = originX + (position.x + 0.5) * cellSize;
  const y = originY + (position.y + 0.5) * cellSize;
  const pulse = 0.55 + 0.35 * Math.sin(timeMs * 0.007);
  const r = cellSize * (0.52 + pulse * 0.08);

  ctx.save();
  ctx.strokeStyle = `rgba(193, 18, 31, ${0.45 + pulse * 0.35})`;
  ctx.fillStyle = `rgba(193, 18, 31, ${0.08 + pulse * 0.06})`;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([cellSize * 0.12, cellSize * 0.08]);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}
