import { ASSET_MANIFEST } from "@/data/assets";
import { levelInteractionForNode } from "@/data/levelInteractions";
import { ENEMY_VISUALS } from "@/lib/game/assets";
import { tulouExteriorForRepair } from "@/lib/game/tulouBackground";
import type { JourneyNodeType } from "@/types/journey";

const UI = ASSET_MANIFEST.ui;

export function journeyNodeIcon(type: JourneyNodeType): string {
  switch (type) {
    case "battle":
      return UI.journeyNodeBattle;
    case "pawn_shop":
      return UI.journeyNodePawn;
    case "campfire":
      return UI.journeyNodeCampfire;
  }
}

/** Per-node icon — battle nodes use the featured enemy portrait. */
export function journeyNodeIconForNode(node: {
  id: string;
  type: JourneyNodeType;
}): string {
  if (node.type === "battle") {
    const interaction = levelInteractionForNode(node.id);
    if (interaction) {
      return ENEMY_VISUALS[interaction.featuredEnemy].portrait;
    }
  }
  return journeyNodeIcon(node.type);
}

export { tulouExteriorForRepair };

export function isNarrativePhase(phase: string): boolean {
  return phase === "campfire" || phase === "pawn_shop";
}

/** Compact top bar during live combat and the 乡音符 grab window. */
export function isJourneyScrollCompact(phase: string): boolean {
  return phase === "battle" || phase === "opening_buff";
}
