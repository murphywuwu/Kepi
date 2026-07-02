import { BALANCE } from "@/data/balance";
import { JOURNEY, journeyNodeAt } from "@/data/journey";
import type { GameSnapshot, ScenePhase } from "@/types";
import type { JourneyNode } from "@/types/journey";
import { campfireScenarioForNode } from "@/data/campfire";

export function computeKebiThreshold(bloodDebtCount: number): number {
  return BALANCE.journey.baseKebiThreshold + bloodDebtCount;
}

export function syncKebiThreshold(state: GameSnapshot["state"]): GameSnapshot["state"] {
  const threshold = computeKebiThreshold(state.bloodDebtCount);
  if (state.kebiThreshold === threshold) return state;
  return { ...state, kebiThreshold: threshold };
}

export function currentJourneyNode(snapshot: GameSnapshot): JourneyNode {
  return journeyNodeAt(snapshot.state.journeyIndex)!;
}

export function isFinalJourneyNode(snapshot: GameSnapshot): boolean {
  const node = currentJourneyNode(snapshot);
  return Boolean(node.isFinal) || snapshot.state.journeyIndex >= snapshot.state.totalNodes - 1;
}

export function battleStageForNode(node: JourneyNode): number {
  return node.battleStage ?? 1;
}

export function scalingForNode(node: JourneyNode): number | undefined {
  return node.scalingOverride;
}

export function phaseForJourneyNode(node: JourneyNode): ScenePhase {
  if (node.type === "pawn_shop") return "pawn_shop";
  if (node.type === "campfire") return "campfire";
  return "prep";
}

export function enterJourneyNode(
  snapshot: GameSnapshot,
  index: number,
): GameSnapshot {
  const node = journeyNodeAt(index);
  if (!node) {
    return snapshot;
  }

  const phase = phaseForJourneyNode(node);
  let next: GameSnapshot = {
    ...snapshot,
    phase,
    state: {
      ...snapshot.state,
      journeyIndex: index,
      currentNodeId: node.id,
      stage: node.type === "battle" ? battleStageForNode(node) : snapshot.state.stage,
      roundPawnCount: 0,
      roundBloodDebt: false,
    },
    battle: null,
    lastBattleResult: null,
    settlement: null,
    openingBuff: null,
    activeOpeningBuff: null,
    campfire:
      node.type === "campfire"
        ? buildCampfireRuntime(node.id)
        : null,
  };

  if (node.type === "battle") {
    next = { ...next, shop: snapshot.shop };
  }

  return next;
}

function buildCampfireRuntime(nodeId: string) {
  const scenario = campfireScenarioForNode(nodeId);
  return {
    scenarioId: scenario.id,
    choiceAId: scenario.choices[0]!.id,
    choiceBId: scenario.choices[1]!.id,
  };
}

export function startJourney(snapshot: GameSnapshot): GameSnapshot {
  return enterJourneyNode(snapshot, 0);
}

export { JOURNEY, journeyNodeAt };
