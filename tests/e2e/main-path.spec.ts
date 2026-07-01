import { test, expect } from "@playwright/test";
import { createInitialSnapshot, createPiece, resetPieceCounter } from "../../src/engine";

/**
 * V2.0 Feature A smoke path: start → at least one battle → settlement → ending.
 * Uses two consecutive losses (survival 2 → 0) to reach the failure ending quickly.
 */
test("runs start → battle → settlement → ending main path", async ({ page }) => {
  test.setTimeout(120_000);

  resetPieceCounter(0);
  const seeded = createInitialSnapshot();
  seeded.board.push(createPiece("farmer"));

  await page.addInitScript((saved) => {
    try {
      localStorage.clear();
      localStorage.setItem("kepi.snapshot", saved);
    } catch {
      /* ignore */
    }
  }, JSON.stringify(seeded));

  await page.goto("/");

  const startBattle = page.getByRole("button", { name: /^开战/ });
  await expect(startBattle).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/人口 1\//)).toBeVisible({ timeout: 10_000 });

  const advance = page.getByRole("button", {
    name: /进入下一关|查看结局|重整再战/,
  });

  for (let round = 0; round < 2; round += 1) {
    await startBattle.click();
    await advance.waitFor({ state: "visible", timeout: 25_000 });
    await page.waitForTimeout(600);

    const ended = /查看结局/.test(await advance.innerText());
    await advance.click();
    if (ended) break;

    await expect(startBattle).toBeVisible({ timeout: 20_000 });
  }

  await expect(page.getByLabel("结局过场")).toBeVisible({ timeout: 20_000 });
});
