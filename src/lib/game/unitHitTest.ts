import type { BoardMetrics } from "@/lib/game/boardLayout";
import {
  pointInHitbox,
  resolveAllyBoardPosition,
  resolveEnemyBoardPosition,
  unitSpriteMetrics,
} from "@/lib/game/unitLayout";
import type { Enemy, Piece, ScenePhase } from "@/types";

export type UnitHitOptions = {
  /** Prep placement mode: skip ally sprites so enemy inspect stays usable. */
  skipAllies?: boolean;
};

export type UnitHitTarget = {
  side: "ally" | "enemy";
  id: string;
  sortY: number;
};

const HOVER_PHASES: ScenePhase[] = ["prep", "battle", "settlement"];

export function hitTestUnits(
  x: number,
  y: number,
  metrics: BoardMetrics,
  allies: Piece[],
  enemies: Enemy[],
  phase: ScenePhase,
  options?: UnitHitOptions,
): UnitHitTarget | null {
  if (!HOVER_PHASES.includes(phase)) return null;

  const hits: UnitHitTarget[] = [];
  const skipAllies = options?.skipAllies ?? false;

  if (!skipAllies) {
    allies.forEach((piece, index) => {
      if (phase === "prep" && piece.position === null) return;

      const position = resolveAllyBoardPosition(piece, index);
      const sprite = unitSpriteMetrics(position, metrics);
      if (pointInHitbox(x, y, sprite)) {
        hits.push({ side: "ally", id: piece.id, sortY: sprite.sortY });
      }
    });
  }

  enemies.forEach((enemy, index) => {
    const position = resolveEnemyBoardPosition(enemy, index, enemies.length);
    const sprite = unitSpriteMetrics(position, metrics);
    if (pointInHitbox(x, y, sprite)) {
      hits.push({ side: "enemy", id: enemy.id, sortY: sprite.sortY });
    }
  });

  if (hits.length === 0) return null;

  hits.sort((a, b) => b.sortY - a.sortY);
  return hits[0]!;
}
