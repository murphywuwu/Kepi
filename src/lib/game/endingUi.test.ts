import { describe, expect, it } from "vitest";
import { endingArtworkSrc, endingCatchHint } from "./endingUi";

describe("endingUi", () => {
  it("maps ending types to dedicated artwork", () => {
    expect(endingArtworkSrc("perfect_homecoming")).toContain("kepi_ending-perfect");
    expect(endingArtworkSrc("regretful_stay")).toContain("kepi_ending-regret");
    expect(endingArtworkSrc("storm_rescue")).toContain("kepi_ending-storm");
  });

  it("updates catch hint for bullet time", () => {
    expect(endingCatchHint("pointer", false)).toContain("点击");
    expect(endingCatchHint("pointer", true)).toContain("子弹时间");
  });
});
