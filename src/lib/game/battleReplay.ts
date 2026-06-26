import type { BattleEvent, Enemy, Piece } from "@/types";

export function replayBattleHp(
  allies: Piece[],
  enemies: Enemy[],
  events: BattleEvent[],
  eventCount: number,
): { allies: Piece[]; enemies: Enemy[] } {
  const hpById = new Map<string, number>();

  for (const ally of allies) {
    hpById.set(ally.id, ally.hp);
  }
  for (const enemy of enemies) {
    hpById.set(enemy.id, enemy.hp);
  }

  const limit = Math.max(0, Math.min(eventCount, events.length));
  for (let i = 0; i < limit; i += 1) {
    const event = events[i]!;
    if (event.type !== "attack") continue;

    const current = hpById.get(event.targetId);
    if (current === undefined) continue;
    hpById.set(event.targetId, Math.max(0, current - event.damage));
  }

  return {
    allies: allies.map((ally) => ({
      ...ally,
      hp: hpById.get(ally.id) ?? ally.hp,
    })),
    enemies: enemies.map((enemy) => ({
      ...enemy,
      hp: hpById.get(enemy.id) ?? enemy.hp,
    })),
  };
}

export function battleReplayEventCount(
  phase: "prep" | "battle" | "settlement" | "ending" | "settings",
  battleTick: number,
  eventLength: number,
): number {
  if (phase === "settlement") return eventLength;
  if (phase === "battle") return battleTick;
  return 0;
}
