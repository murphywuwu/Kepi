import { describe, expect, it } from "vitest";
import { JOURNEY } from "@/data/journey";
import { createInitialSnapshot } from "@/engine";
import { enterJourneyNode } from "@/engine/journey";

describe("journey layer (V3.1)", () => {
  it("starts on the first campfire node", () => {
    const snapshot = createInitialSnapshot();
    expect(snapshot.state.journeyIndex).toBe(0);
    expect(snapshot.state.currentNodeId).toBe("camp-1");
    expect(snapshot.state.totalNodes).toBe(JOURNEY.nodes.length);
    expect(snapshot.phase).toBe("campfire");
  });

  it("enters battle-3 prep at journey index 3", () => {
    let snapshot = createInitialSnapshot();
    snapshot = enterJourneyNode(snapshot, 3);
    expect(snapshot.state.journeyIndex).toBe(3);
    expect(snapshot.state.currentNodeId).toBe("battle-3");
    expect(snapshot.state.stage).toBe(3);
    expect(snapshot.phase).toBe("prep");
  });

  it("marks the seventh level as final", () => {
    let snapshot = createInitialSnapshot();
    snapshot = enterJourneyNode(snapshot, 6);
    expect(snapshot.state.currentNodeId).toBe("battle-7");
    expect(JOURNEY.nodes[6]?.isFinal).toBe(true);
    expect(snapshot.phase).toBe("prep");
  });
});
