import { describe, expect, it } from "vitest";
import { journeyBattleBrief } from "./journeyBattleHints";

describe("journeyBattleBrief", () => {
  it("returns关隘盘查 brief for battle-3", () => {
    const brief = journeyBattleBrief("battle-3");
    expect(brief?.featuredEnemy).toBe("luyinguanli");
    expect(brief?.difficultyLabel).toBe("普通");
    expect(brief?.battleHint).toContain("关吏");
  });

  it("returns海禁余波 brief for battle-2", () => {
    const brief = journeyBattleBrief("battle-2");
    expect(brief?.featuredEnemy).toBe("qianhaibei");
    expect(brief?.difficultyLabel).toBe("教学");
    expect(brief?.battleHint).toContain("碑影");
  });

  it("returns null for non-battle nodes", () => {
    expect(journeyBattleBrief("pawn-1")).toBeNull();
  });
});
