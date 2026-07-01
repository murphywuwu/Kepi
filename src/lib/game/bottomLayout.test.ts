import { describe, expect, it } from "vitest";
import {
  benchBottomRem,
  benchDockBottomOffset,
  BOTTOM_BENCH_CLEARANCE_REM,
} from "./bottomLayout";

describe("bottomLayout", () => {
  it("uses measured dock height when available", () => {
    expect(benchDockBottomOffset(320, 16, 20)).toBe(
      `${320 + BOTTOM_BENCH_CLEARANCE_REM * 16}px`,
    );
  });

  it("falls back to rem estimate before dock is measured", () => {
    expect(benchDockBottomOffset(0, 16, 22)).toBe("22rem");
  });

  it("assumes expanded letter strip in fallback estimate", () => {
    const collapsed = benchBottomRem(true, false);
    const expanded = benchBottomRem(true, true);
    expect(expanded).toBeGreaterThan(collapsed);
  });
});
