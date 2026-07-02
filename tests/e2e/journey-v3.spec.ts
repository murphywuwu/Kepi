import { test, expect } from "@playwright/test";

test("campfire choice advances to battle prep", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "南洋余温" })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole("button", { name: "听下去" }).click();

  await page.getByRole("button", { name: "分给大家" }).click();
  await page.getByRole("button", { name: "今夜如此" }).click();

  await expect(page.getByText("归途 2/7")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "海禁余波" })).toBeVisible({
    timeout: 10_000,
  });

  await page.getByRole("button", { name: "进入备战" }).click();

  await expect(page.getByText("首战斗引导")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("备军图")).toBeVisible();
});

test("camp-2 cinematic advances to battle prep", async ({ page }) => {
  await page.goto("/debug");
  await page.getByRole("button", { name: "归途 5" }).click();

  await expect(page.getByRole("heading", { name: "归途夜话" })).toBeVisible({
    timeout: 10_000,
  });

  await page.getByRole("button", { name: "听下去" }).click();
  await page.getByRole("button", { name: "稳着走" }).click();
  await page.getByRole("button", { name: "今夜如此" }).click();

  await expect(page.getByText("归途 6/7")).toBeVisible({ timeout: 15_000 });
});

test("pawn shop opens from debug jump", async ({ page }) => {
  await page.goto("/debug");
  await page.getByRole("button", { name: "典当行" }).click();

  await expect(page.getByRole("heading", { name: "客批典当行" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText("长按信纸，燃烧当信")).toBeVisible();
});

test("battle-3 prep shows contract modifiers", async ({ page }) => {
  await page.goto("/debug");
  await page.getByRole("button", { name: "归途 6" }).click();

  await expect(page.getByRole("heading", { name: "契约束缚" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText("敌情强化 ×2")).toBeVisible();
  await page.getByRole("button", { name: "进入备战" }).click();
  await expect(page.getByText("备军图")).toBeVisible();
});

test("battle-final prep shows extreme modifiers", async ({ page }) => {
  await page.goto("/debug");
  await page.getByRole("button", { name: "归途 7" }).click();

  await expect(page.getByRole("heading", { name: "风浪归乡" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText("敌情强化 ×2.5")).toBeVisible();
  await expect(page.getByText("械斗火")).toBeVisible();
  await page.getByRole("button", { name: "进入备战" }).click();
  await expect(page.getByText("终局一战")).toBeVisible();
});
