import type { HomeRepairMilestone } from "@/types";
import type { PrepFxKind } from "@/store/fxStore";
import { ASSET_MANIFEST } from "@/data/assets";

export function prepFxKindForMilestone(
  milestone: HomeRepairMilestone,
): PrepFxKind {
  if (milestone === 33) return "tulou_well";
  if (milestone === 66) return "tulou_wall";
  return "tulou_lantern";
}

export function milestoneLabel(milestone: HomeRepairMilestone): string {
  if (milestone === 33) return "修缮·初见 — 水井出水";
  if (milestone === 66) return "翻新·同心 — 外墙补全";
  return "焕然·不屈 — 祠堂灯火";
}

export function playTulouMilestoneSfx(milestone: HomeRepairMilestone): void {
  if (typeof window === "undefined") return;

  const src =
    milestone === 33
      ? ASSET_MANIFEST.audio.sfxWellWater
      : milestone === 66
        ? ASSET_MANIFEST.audio.sfxWallRepair
        : ASSET_MANIFEST.audio.sfxLanternGlow;

  const audio = new Audio(src);
  audio.volume = milestone === 99 ? 0.58 : 0.68;
  void audio.play().catch(() => undefined);
}
