import {
  allAllyCells,
  allEnemyCells,
  ALLY_ROWS,
  boardToPixel,
  BOARD_COLS,
  ENEMY_ROWS,
  NEUTRAL_ROWS,
  zoneRowBounds,
} from "@/lib/game/boardLayout";
import { UNIT_FEET_OFFSET_RATIO } from "@/lib/game/unitLayout";
import {
  drawAssassinWarningRing,
  drawPlacementHintRing,
  hasAssassinThreat,
  prepPlacementHints,
  shuikeAssassinWarningPosition,
} from "@/lib/game/placementHints";
import type { BoardPosition } from "@/types";
import type { CanvasRenderState, CanvasTheme } from "./types";

export function renderBoardLayer(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
  theme: CanvasTheme,
): void {
  const showZones = state.phase === "prep";
  const { metrics } = state;

  if (showZones) {
    drawZoneBand(ctx, metrics, ENEMY_ROWS, "rgba(193, 18, 31, 0.07)", theme.enemyStroke);
    drawZoneBand(ctx, metrics, NEUTRAL_ROWS, "rgba(245, 234, 214, 0.04)", "rgba(107, 91, 79, 0.25)");
    drawZoneBand(ctx, metrics, ALLY_ROWS, "rgba(74, 111, 165, 0.14)", theme.allyStroke);
    drawZoneDivider(ctx, metrics, NEUTRAL_ROWS[0]!);
    drawZoneLabel(ctx, metrics, ENEMY_ROWS[0]!, "敌阵", theme.enemyStroke);
    drawZoneLabel(ctx, metrics, ALLY_ROWS[0]!, "我阵", theme.allyStroke);
  }

  if (showZones) {
    drawEnemyPlacementSlots(ctx, state, theme);
    drawAllyPlacementSlots(ctx, state, theme);
    drawPrepPlacementHints(ctx, state);
  }

  if (state.phase === "prep" && state.hoveredAllyCell) {
    drawHoveredAllyCell(ctx, state.hoveredAllyCell, state, theme);
  }

  ctx.globalAlpha = 1;
}

function occupiedAllyCells(allies: CanvasRenderState["allies"]): Set<string> {
  const set = new Set<string>();
  for (const piece of allies) {
    if (piece.position) {
      set.add(`${piece.position.x},${piece.position.y}`);
    }
  }
  return set;
}

function isHoveredCell(
  cell: BoardPosition,
  hovered: BoardPosition | null,
): boolean {
  return hovered?.x === cell.x && hovered?.y === cell.y;
}

function drawEnemyPlacementSlots(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
  theme: CanvasTheme,
): void {
  if (state.selectedPieceId) return;

  const { metrics } = state;
  for (const cell of allEnemyCells()) {
    const { x, y: cellY } = boardToPixel(cell, metrics);
    const y = cellY + metrics.cellSize * UNIT_FEET_OFFSET_RATIO;
    const r = metrics.cellSize * 0.34;
    ctx.save();
    ctx.fillStyle = "rgba(193,18,31,0.05)";
    ctx.strokeStyle = theme.enemyStroke;
    ctx.lineWidth = 1;
    ctx.globalAlpha = state.enemies.length > 0 ? 0.14 : 0.1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawAllyPlacementSlots(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
  theme: CanvasTheme,
): void {
  const { metrics, hoveredAllyCell, selectedPieceId } = state;
  const occupied = occupiedAllyCells(state.allies);
  const placing = Boolean(selectedPieceId);

  for (const cell of allAllyCells()) {
    if (isHoveredCell(cell, hoveredAllyCell)) continue;

    const { x, y } = boardToPixel(cell, metrics);
    const isOccupied = occupied.has(`${cell.x},${cell.y}`);
    const r = metrics.cellSize * 0.36;

    ctx.save();

    ctx.fillStyle = "rgba(74, 111, 165, 0.16)";
    ctx.globalAlpha = isOccupied ? 0.22 : placing ? 0.38 : 0.48;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = theme.allyStroke;
    ctx.lineWidth = isOccupied ? 1 : 1.25;
    ctx.globalAlpha = isOccupied ? 0.28 : placing ? 0.42 : 0.52;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = theme.allyStroke;
    ctx.globalAlpha = isOccupied ? 0.2 : 0.34;
    ctx.beginPath();
    ctx.arc(x, y, metrics.cellSize * 0.055, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawPrepPlacementHints(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
): void {
  const pulse = 0.38 + 0.22 * Math.sin(state.timeMs * 0.005);
  const hints = prepPlacementHints(state.allies, state.stage);
  const seen = new Set<string>();

  for (const hint of hints) {
    const key = `${hint.cell.x},${hint.cell.y}:${hint.kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    drawPlacementHintRing(ctx, hint.cell, state.metrics, hint.kind, pulse);
  }

  if (!hasAssassinThreat(state.stage)) return;
  const shuikePos = shuikeAssassinWarningPosition(state.allies);
  if (!shuikePos) return;
  drawAssassinWarningRing(ctx, shuikePos, state.metrics, state.timeMs);
}

function drawHoveredAllyCell(
  ctx: CanvasRenderingContext2D,
  cell: BoardPosition,
  state: CanvasRenderState,
  theme: CanvasTheme,
): void {
  const { metrics, timeMs } = state;
  const pulse = 0.42 + 0.28 * Math.sin(timeMs * 0.006);
  const { x, y } = boardToPixel(cell, metrics);
  const r = metrics.cellSize * 0.38;

  ctx.save();

  ctx.fillStyle = "rgba(142, 202, 230, 0.22)";
  ctx.globalAlpha = pulse * 0.85;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = theme.allyStroke;
  ctx.lineWidth = 2;
  ctx.globalAlpha = pulse;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawZoneBand(
  ctx: CanvasRenderingContext2D,
  metrics: CanvasRenderState["metrics"],
  rows: readonly number[],
  fill: string,
  stroke: string,
): void {
  const { x, y, w, h } = zoneRowBounds(rows, metrics);
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}

function drawZoneDivider(
  ctx: CanvasRenderingContext2D,
  metrics: CanvasRenderState["metrics"],
  neutralRow: number,
): void {
  const y = metrics.originY + neutralRow * metrics.cellSize + metrics.cellSize * 0.5;
  ctx.save();
  ctx.strokeStyle = "rgba(107, 91, 79, 0.28)";
  ctx.lineWidth = 1;
  ctx.setLineDash([metrics.cellSize * 0.18, metrics.cellSize * 0.12]);
  ctx.beginPath();
  ctx.moveTo(metrics.originX, y);
  ctx.lineTo(metrics.originX + BOARD_COLS * metrics.cellSize, y);
  ctx.stroke();
  ctx.restore();
}

function drawZoneLabel(
  ctx: CanvasRenderingContext2D,
  metrics: CanvasRenderState["metrics"],
  row: number,
  text: string,
  color: string,
): void {
  const { x, y } = boardToPixel({ x: 0, y: row }, metrics);
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.font = `600 ${Math.max(11, metrics.cellSize * 0.22)}px var(--font-sans, sans-serif)`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x - metrics.cellSize * 0.55, y);
  ctx.restore();
}
