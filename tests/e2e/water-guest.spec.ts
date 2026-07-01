import { test, expect } from "@playwright/test";

/**
 * Verifies Feature D: winning with a dead water guest must not increase kebi.
 * Seeds a settlement-phase snapshot via localStorage (same path as game resume).
 */
test("does not gain kebi when water guest died on a won stage", async ({ page }) => {
  const settlementSnapshot = {
    version: 2,
    phase: "settlement",
    state: {
      stage: 1,
      totalStages: 4,
      survival: 2,
      kebi: 0,
      kebiThreshold: 4,
      sangzi: 0,
      homeRepair: 0,
      homeRepairTier: 0,
      gold: 10,
      population: 3,
      winStreak: 1,
      loseStreak: 0,
      pawnedKebi: 0,
      roundPawnCount: 0,
      result: null,
      endingType: null,
    },
    board: [],
    shop: { slots: ["farmer", "guard", "shuike", "teacher", "xiangxian"], refreshCost: 2 },
    battle: null,
    lastBattleResult: {
      won: true,
      tick: 40,
      elapsedMs: 320,
      events: [{ type: "roundEnd" }, { type: "waterGuestDied" }],
      alliesRemaining: 1,
      enemiesRemaining: 0,
      allyHpPercent: 55,
      enemyHpPercent: 0,
      waterGuest: {
        pieceId: "shuike_1",
        deployed: true,
        survived: false,
        died: true,
      },
    },
    settlement: {
      won: true,
      kebiGained: 0,
      sangziGained: 0,
      sangziConsumed: 0,
      homeRepairBefore: 0,
      homeRepairGained: 0,
      homeRepairAfter: 0,
      survivalLost: 0,
      waterGuestDeployed: true,
      waterGuestSurvived: false,
      waterGuestDied: true,
      xiangxianBonusApplied: false,
      homeRepairMilestone: null,
    },
  };

  await page.addInitScript((snapshot) => {
    try {
      localStorage.clear();
      localStorage.setItem("kepi.snapshot", JSON.stringify(snapshot));
    } catch {
      /* ignore */
    }
  }, settlementSnapshot);

  await page.goto("/");

  await expect(page.getByRole("heading", { name: /胜利，但信丢了/ })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("本回合收益为空")).toBeVisible();
  await expect(page.getByText("客批 0/4")).toBeVisible();
});
