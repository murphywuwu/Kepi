import { journeyNodeById } from "@/data/journey";

export type PrepSubview = "stage_brief" | "active";

export function isBattleNodeId(nodeId: string): boolean {
  const node = journeyNodeById(nodeId);
  return node?.type === "battle";
}

export function shouldShowStageBrief(
  nodeId: string,
  seenNodeIds: ReadonlySet<string>,
): boolean {
  return isBattleNodeId(nodeId) && !seenNodeIds.has(nodeId);
}

export function isPrepInteractive(subview: PrepSubview): boolean {
  return subview === "active";
}
