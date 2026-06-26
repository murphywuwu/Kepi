import { describe, expect, it } from "vitest";
import { spawnEnemiesForStage } from "@/engine/battle";
import { createPiece } from "@/engine/shop";
import type { BattleEvent } from "@/types";
import { battleReplayEventCount, replayBattleHp } from "./battleReplay";

describe("replayBattleHp", () => {
  it("reduces target hp after attack events up to eventCount", () => {
    const farmer = createPiece("farmer");
    const enemies = spawnEnemiesForStage(1);
    const target = enemies[0]!;

    const events: BattleEvent[] = [
      {
        type: "attack",
        sourceId: farmer.id,
        targetId: target.id,
        damage: 120,
      },
      {
        type: "attack",
        sourceId: target.id,
        targetId: farmer.id,
        damage: 80,
      },
    ];

    const afterOne = replayBattleHp([farmer], enemies, events, 1);
    expect(afterOne.enemies[0]?.hp).toBe(target.hp - 120);
    expect(afterOne.allies[0]?.hp).toBe(farmer.hp);

    const afterTwo = replayBattleHp([farmer], enemies, events, 2);
    expect(afterTwo.allies[0]?.hp).toBe(farmer.hp - 80);
  });

  it("clamps hp at zero", () => {
    const farmer = createPiece("farmer");
    const events: BattleEvent[] = [
      {
        type: "attack",
        sourceId: "enemy_1_0",
        targetId: farmer.id,
        damage: 9999,
      },
    ];

    const replayed = replayBattleHp([farmer], [], events, 1);
    expect(replayed.allies[0]?.hp).toBe(0);
  });
});

describe("battleReplayEventCount", () => {
  it("uses full event log on settlement", () => {
    expect(battleReplayEventCount("settlement", 0, 12)).toBe(12);
  });

  it("uses battle tick during battle", () => {
    expect(battleReplayEventCount("battle", 5, 12)).toBe(5);
  });
});
