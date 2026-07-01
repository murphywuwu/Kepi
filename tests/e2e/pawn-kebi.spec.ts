import { test, expect } from "@playwright/test";
import { createInitialSnapshot } from "../../src/engine";
import { STORAGE_KEYS } from "../../src/lib/storage/keys";

test("pawn kebi updates gold and letter count in prep", async ({ page }) => {
  const seeded = createInitialSnapshot();
  seeded.state.kebi = 2;
  seeded.state.gold = 8;

  await page.addInitScript(
    ({ key, snapshot }) => {
      try {
        localStorage.setItem(key, JSON.stringify(snapshot));
      } catch {
        /* ignore */
      }
    },
    { key: STORAGE_KEYS.snapshot, snapshot: seeded },
  );

  await page.goto("/");
  await expect(page.getByRole("button", { name: /^开战/ })).toBeVisible({
    timeout: 20_000,
  });

  const pawnButton = page.getByRole("button", { name: /典当 \+15/ });
  await expect(pawnButton).toBeEnabled();

  await pawnButton.click();

  await expect(
    page.getByText("典当 1 封客批，获得 15 金币"),
  ).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText("1/4")).toBeVisible();
  await expect(page.getByText("23", { exact: true })).toBeVisible();
  await expect(pawnButton).toBeEnabled();
});
