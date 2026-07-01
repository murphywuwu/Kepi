import { describe, expect, it } from "vitest";
import { createPiece } from "@/engine/shop";
import { simulateBattle } from "./index";

describe("tulou battle buffs", () => {
  it("applies tier-1 shield so allies survive longer", () => {
    const farmer = createPiece("farmer");
    farmer.position = { x: 2, y: 5 };

    const without = simulateBattle({
      stage: 1,
      allies: [farmer],
      homeRepairTier: 0,
      enemies: [
        {
          id: "e1",
          type: "qianhaibei",
          hp: 50,
          maxHp: 50,
          atk: 200,
          atkSpeed: 2,
          armor: 0,
          range: "melee",
          position: { x: 2, y: 1 },
        },
      ],
    });

    const withShield = simulateBattle({
      stage: 1,
      allies: [structuredClone(farmer)],
      homeRepairTier: 1,
      enemies: [
        {
          id: "e1",
          type: "qianhaibei",
          hp: 50,
          maxHp: 50,
          atk: 200,
          atkSpeed: 2,
          armor: 0,
          range: "melee",
          position: { x: 2, y: 1 },
        },
      ],
    });

    expect(withShield.allyHpPercent).toBeGreaterThanOrEqual(without.allyHpPercent);
  });

  it("records cheat-death skill event at tier 3", () => {
    const farmer = createPiece("farmer");
    farmer.position = { x: 2, y: 5 };

    const result = simulateBattle({
      stage: 1,
      allies: [farmer],
      homeRepairTier: 3,
      enemies: [
        {
          id: "e1",
          type: "qianhaibei",
          hp: 8000,
          maxHp: 8000,
          atk: 600,
          atkSpeed: 1.2,
          armor: 0,
          range: "melee",
          position: { x: 2, y: 1 },
        },
      ],
    });

    expect(
      result.events.some((event) => event.type === "skill" && event.skillId === "tulou_cheat_death"),
    ).toBe(true);
  });
});
