import { describe, expect, it } from "vitest";
import { createInitialSnapshot } from "@/engine";
import { groupShopOffers } from "./shopOffers";

describe("groupShopOffers", () => {
  it("merges duplicate slot types", () => {
    expect(groupShopOffers(["farmer", "farmer", "guard", "farmer"])).toEqual([
      { type: "farmer", count: 3 },
      { type: "guard", count: 1 },
    ]);
  });
});

describe("stage 1 shop pool", () => {
  it("includes guard from the first stage", () => {
    const snapshot = createInitialSnapshot();
    expect(snapshot.shop.slots).toContain("farmer");
    expect(snapshot.shop.slots).toContain("guard");
  });
});
