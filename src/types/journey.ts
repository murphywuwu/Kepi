/** V3.1 journey layer — linear homecoming route node types. */

export type JourneyNodeType = "battle" | "pawn_shop" | "campfire";

export type JourneyNode = {
  id: string;
  type: JourneyNodeType;
  label: string;
  /** Battle stage index for enemy spawning (battle nodes only). */
  battleStage?: number;
  difficulty?: "tutorial" | "normal" | "hard" | "extreme";
  /** Optional scaling override for hard / final fights. */
  scalingOverride?: number;
  isFinal?: boolean;
};

export type JourneyDefinition = {
  id: string;
  label: string;
  nodes: readonly JourneyNode[];
};
