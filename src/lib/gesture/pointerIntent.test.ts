import { describe, expect, it } from "vitest";
import {
  holdProgressFromElapsed,
  isLongPressWithinMoveTolerance,
  swipeIntentFromDelta,
} from "./pointerIntent";

describe("pointer gesture intent helpers", () => {
  it("maps horizontal swipe distance to direction intents", () => {
    expect(swipeIntentFromDelta(-60, 48)).toBe("SWIPE_LEFT");
    expect(swipeIntentFromDelta(60, 48)).toBe("SWIPE_RIGHT");
    expect(swipeIntentFromDelta(20, 48)).toBeNull();
  });

  it("normalizes long-press progress", () => {
    expect(holdProgressFromElapsed(-10, 1000)).toBe(0);
    expect(holdProgressFromElapsed(500, 1000)).toBe(0.5);
    expect(holdProgressFromElapsed(1200, 1000)).toBe(1);
  });

  it("keeps hold valid only while movement stays within tolerance", () => {
    const start = { x: 100, y: 100 };
    expect(isLongPressWithinMoveTolerance(start, { x: 106, y: 106 }, 12)).toBe(
      true,
    );
    expect(isLongPressWithinMoveTolerance(start, { x: 120, y: 100 }, 12)).toBe(
      false,
    );
  });
});
