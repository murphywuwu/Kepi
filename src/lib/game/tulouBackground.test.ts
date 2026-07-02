import { describe, expect, it } from "vitest";
import {
  resolveSceneBackgroundLayers,
  resolveTulouBackgroundLayers,
  tulouRepairStageForValue,
} from "./tulouBackground";

describe("resolveTulouBackgroundLayers", () => {
  it("returns exterior ruined at low repair", () => {
    const layers = resolveTulouBackgroundLayers(10);
    expect(layers).toHaveLength(1);
    expect(layers[0]?.alpha).toBe(1);
    expect(layers[0]?.src).toContain("tulou-exterior-ruined");
  });

  it("returns exterior repair tier at 33% repair", () => {
    const layers = resolveTulouBackgroundLayers(33);
    expect(layers).toHaveLength(1);
    expect(layers[0]?.alpha).toBe(1);
    expect(layers[0]?.src).toContain("tulou-exterior-repair");
  });

  it("returns exterior renew at high repair", () => {
    const layers = resolveTulouBackgroundLayers(90);
    expect(layers[0]?.src).toContain("tulou-exterior-renew");
  });
});

describe("resolveSceneBackgroundLayers", () => {
  it("uses the battle ground for playable canvas phases", () => {
    expect(resolveSceneBackgroundLayers("prep", 10)[0]?.src).toContain(
      "battle-ground-yard",
    );
    expect(resolveSceneBackgroundLayers("battle", 10)[0]?.src).toContain(
      "battle-ground-yard",
    );
    expect(resolveSceneBackgroundLayers("settlement", 99)[0]?.src).toContain(
      "battle-ground-yard",
    );
  });

  it("keeps exterior tiers for narrative phases", () => {
    const layers = resolveSceneBackgroundLayers("campfire", 99);
    expect(layers[0]?.src).toContain("tulou-exterior-glow");
  });
});

describe("tulouRepairStageForValue", () => {
  it("maps repair values to six board stages", () => {
    expect(tulouRepairStageForValue(0).src).toBe(
      "/images/board/kepi_tulou-stage1-broken.png",
    );
    expect(tulouRepairStageForValue(0).id).toBe("stage1");
    expect(tulouRepairStageForValue(16).id).toBe("stage2");
    expect(tulouRepairStageForValue(32).id).toBe("stage3");
    expect(tulouRepairStageForValue(48).id).toBe("stage4");
    expect(tulouRepairStageForValue(64).id).toBe("stage5");
    expect(tulouRepairStageForValue(80).id).toBe("stage6");
    expect(tulouRepairStageForValue(100).id).toBe("stage6");
  });
});
