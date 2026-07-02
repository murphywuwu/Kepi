"use client";

import { useEffect } from "react";
import { journeyNodeAt } from "@/data/journey";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";

/** Sync prep subview when entering a battle prep node. */
export function usePrepNodeEnter() {
  const phase = useGameStore((state) => state.snapshot.phase);
  const journeyIndex = useGameStore((state) => state.snapshot.state.journeyIndex);
  const currentNodeId = useGameStore((state) => state.snapshot.state.currentNodeId);
  const board = useGameStore((state) => state.snapshot.board);
  const enterPrepNode = useUIStore((state) => state.enterPrepNode);

  useEffect(() => {
    if (phase !== "prep") return;
    const node = journeyNodeAt(journeyIndex);
    if (!node || node.type !== "battle") return;
    enterPrepNode(node.id, board);
  }, [phase, journeyIndex, currentNodeId, enterPrepNode, board]);
}
