import { ASSET_MANIFEST } from "@/data/assets";
import type { EndingType } from "@/types";

const ENDING = ASSET_MANIFEST.ending;

export function endingArtworkSrc(endingType: EndingType): string {
  switch (endingType) {
    case "perfect_homecoming":
      return ENDING.perfect;
    case "regretful_stay":
      return ENDING.regret;
    case "storm_rescue":
      return ENDING.storm;
  }
}

/** Horizontal slots for falling letter props in the catch phase. */
export const ENDING_LETTER_FALL_SLOTS = [
  { left: "14%", delay: "0s", drift: "-8deg" },
  { left: "30%", delay: "0.35s", drift: "6deg" },
  { left: "46%", delay: "0.15s", drift: "-4deg" },
  { left: "62%", delay: "0.55s", drift: "8deg" },
  { left: "78%", delay: "0.25s", drift: "-6deg" },
] as const;

export function endingCatchHint(
  gestureMode: "pointer" | "gesture",
  slowTime: boolean,
): string {
  if (slowTime) {
    return "子弹时间 — 客批飘落变慢，快伸手护住";
  }
  return gestureMode === "gesture"
    ? "左右滑动手势减速 · 点击接住飘落的客批"
    : "左右滑动或点击客批减速 · 点击信件接住";
}
