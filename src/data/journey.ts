import type { JourneyDefinition } from "@/types/journey";

/** Fixed 7-node homecoming route — PRD V3.1 sample + level interaction design. */
export const JOURNEY: JourneyDefinition = {
  id: "homecoming-v3.1",
  label: "南洋 → 故乡",
  nodes: [
    {
      id: "camp-1",
      type: "campfire",
      label: "南洋余温",
    },
    {
      id: "battle-2",
      type: "battle",
      label: "海禁余波",
      battleStage: 2,
      difficulty: "tutorial",
    },
    {
      id: "pawn-1",
      type: "pawn_shop",
      label: "客批典当行",
    },
    {
      id: "battle-3",
      type: "battle",
      label: "关隘盘查",
      battleStage: 3,
      difficulty: "normal",
    },
    {
      id: "camp-2",
      type: "campfire",
      label: "归途夜话",
    },
    {
      id: "battle-4",
      type: "battle",
      label: "契约束缚",
      battleStage: 4,
      difficulty: "hard",
      scalingOverride: 2,
    },
    {
      id: "battle-7",
      type: "battle",
      label: "风浪归乡",
      battleStage: 7,
      difficulty: "extreme",
      scalingOverride: 2.5,
      isFinal: true,
    },
  ],
};

export const TOTAL_JOURNEY_NODES = JOURNEY.nodes.length;

export function journeyNodeAt(index: number) {
  return JOURNEY.nodes[index];
}

export function journeyNodeById(id: string) {
  return JOURNEY.nodes.find((node) => node.id === id);
}
