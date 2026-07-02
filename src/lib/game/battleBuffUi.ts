import { ASSET_MANIFEST } from "@/data/assets";
import type { BattleOpeningBuffId } from "@/data/battleBuffs";

const UI = ASSET_MANIFEST.ui;

export function openingBuffIcon(id: BattleOpeningBuffId): string {
  switch (id) {
    case "ancestral_blessing":
      return UI.buffAncestral;
    case "travel_rations":
      return UI.buffRations;
    case "wind_at_back":
      return UI.buffWind;
  }
}

export function settlementBackdropSrc(
  won: boolean,
  settlement?: {
    waterGuestDied?: boolean;
    kebiGained?: number;
  } | null,
): string | null {
  if (!won) return ASSET_MANIFEST.cinematics.settlementSurvivalLoss;
  if (settlement?.waterGuestDied) {
    return ASSET_MANIFEST.cinematics.settlementWaterguestLost;
  }
  if (settlement && (settlement.kebiGained ?? 0) <= 0) {
    return ASSET_MANIFEST.cinematics.settlementBrokenLetter;
  }
  return null;
}
