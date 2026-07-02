import { describe, expect, it } from "vitest";
import {
  hakkaClanCountOnBoard,
  leafFallReadyHint,
  prepBattleModifiers,
} from "./journeyBattleModifiers";

describe("journeyBattleModifiers", () => {
  it("includes scaling tag for battle-4", () => {
    const modifiers = prepBattleModifiers({
      currentNodeId: "battle-4",
      nextBattleEnemyHpFactor: 1,
    } as Parameters<typeof prepBattleModifiers>[0]);

    expect(modifiers.some((item) => item.id === "scaling" && item.label.includes("×2"))).toBe(
      true,
    );
  });

  it("includes campfire debuff when hp factor reduced", () => {
    const modifiers = prepBattleModifiers({
      currentNodeId: "battle-3",
      nextBattleEnemyHpFactor: 0.9,
    } as Parameters<typeof prepBattleModifiers>[0]);

    expect(modifiers.some((item) => item.id === "camp-debuff")).toBe(true);
  });

  it("includes scaling and ending gate for battle-7", () => {
    const modifiers = prepBattleModifiers({
      currentNodeId: "battle-7",
      nextBattleEnemyHpFactor: 1,
      kebiThreshold: 5,
    } as Parameters<typeof prepBattleModifiers>[0]);

    expect(modifiers.some((item) => item.id === "scaling" && item.label.includes("×2.5"))).toBe(
      true,
    );
    expect(modifiers.some((item) => item.id === "lock_letter")).toBe(true);
    expect(modifiers.some((item) => item.id === "ending-gate")).toBe(true);
  });

  it("detects leaf fall readiness", () => {
    expect(
      leafFallReadyHint(
        hakkaClanCountOnBoard([
          { clan: "hakka" },
          { clan: "hakka" },
          { clan: "hakka" },
          { clan: "hakka" },
        ]),
      ),
    ).toContain("已就绪");
  });
});
