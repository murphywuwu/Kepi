import { journeyNodeById } from "@/data/journey";

export function isFinalBattleNode(nodeId: string | undefined): boolean {
  return nodeId === "battle-7" || Boolean(journeyNodeById(nodeId ?? "")?.isFinal);
}

export function battleHintTickLimit(nodeId: string | undefined): number {
  if (nodeId === "battle-7") return 8;
  if (nodeId === "battle-4" || nodeId === "battle-5" || nodeId === "battle-6") return 4;
  return 2;
}

export function assassinWarningTickLimit(nodeId: string | undefined): number {
  return isFinalBattleNode(nodeId) ? 16 : 1;
}
