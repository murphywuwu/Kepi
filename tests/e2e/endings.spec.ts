import { test, expect } from "@playwright/test";

const STORM_ENDING_SNAPSHOT = {
  version: 3,
  phase: "ending",
  state: {
    stage: 2,
    totalStages: 7,
    totalNodes: 7,
    journeyIndex: 1,
    currentNodeId: "battle-1",
    survival: 0,
    kebi: 1,
    kebiThreshold: 5,
    sangzi: 0,
    homeRepair: 0,
    homeRepairTier: 0,
    gold: 10,
    population: 3,
    winStreak: 0,
    loseStreak: 2,
    pawnedKebi: 0,
    bloodDebtCount: 0,
    roundPawnCount: 0,
    roundBloodDebt: false,
    nextBattleEnemyHpFactor: 1,
    result: "lose",
    endingType: "storm_rescue",
  },
  board: [],
  shop: {
    slots: ["farmer", "guard", "teacher", "fengshui", "patriarch"],
    refreshCost: 1,
  },
  battle: null,
  lastBattleResult: null,
  settlement: null,
};

test("storm_rescue ending loads in main game shell", async ({ page }) => {
  await page.addInitScript((saved) => {
    try {
      localStorage.clear();
      localStorage.setItem("kepi.snapshot", saved);
    } catch {
      /* ignore */
    }
  }, JSON.stringify(STORM_ENDING_SNAPSHOT));

  await page.goto("/");

  const ending = page.getByLabel("结局过场");
  await expect(ending).toBeVisible({ timeout: 20_000 });
  await expect(ending).toHaveAttribute("data-ending-type", "storm_rescue");
  await expect(ending.getByText("风浪抢救")).toBeVisible();
  await expect(ending.getByLabel("结局手势交互层")).toBeVisible();
});

test("perfect_homecoming ending shows homeward ticket badge", async ({ page }) => {
  await page.goto("/debug");
  await page.getByRole("button", { name: "完美结局" }).click();
  await page.goto("/");

  const ending = page.getByLabel("结局过场");
  await expect(ending).toBeVisible({ timeout: 15_000 });
  await expect(ending).toHaveAttribute("data-ending-type", "perfect_homecoming");
  await expect(ending.getByText("归乡票就绪")).toBeVisible();
  await expect(ending.getByLabel("结局手势交互层")).toBeVisible();
});

test("perfect_homecoming ending scene on preview page", async ({ page }) => {
  await page.goto("/ending");

  const ending = page.getByLabel("结局过场");
  await expect(ending).toBeVisible({ timeout: 15_000 });
  await expect(ending).toHaveAttribute("data-ending-type", "perfect_homecoming");
  await expect(ending.getByText("完美归乡")).toBeVisible();
});

test("regretful_stay ending scene on preview page", async ({ page }) => {
  await page.goto("/ending");
  await page.getByTestId("ending-variant-regret").click({ force: true });

  const ending = page.getByLabel("结局过场");
  await expect(ending).toHaveAttribute("data-ending-type", "regretful_stay", {
    timeout: 15_000,
  });
  await expect(ending.getByText("遗憾留守")).toBeVisible();
});
