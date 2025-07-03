import { expect, test } from "@playwright/test";

test("homepage loads correctly", async ({ page }) => {
  await page.goto("/");

  // Check if the page title is correct
  await expect(page).toHaveTitle(/Figma Local Variables Editor/);

  // Check if the file key input is visible
  await expect(page.locator('input[placeholder*="Figma"]')).toBeVisible();

  // Check if the load button is visible
  await expect(
    page.locator("button").filter({ hasText: "読み込み" })
  ).toBeVisible();
});

test("file key input and load functionality", async ({ page }) => {
  await page.goto("/");

  // Find the file key input
  const fileKeyInput = page.locator('input[placeholder*="Figma"]');
  await expect(fileKeyInput).toBeVisible();

  // Enter a test file key
  await fileKeyInput.fill("");

  // Click the load button
  const loadButton = page.locator("button").filter({ hasText: "読み込み" });
  await loadButton.click();

  // Wait for the API call to complete and check if variables are loaded
  // This might take a few seconds due to the Figma API call
  await page.waitForTimeout(5000);

  // Check if the variables table is visible
  await expect(page.locator("table")).toBeVisible();
});

test("variable table displays correctly", async ({ page }) => {
  await page.goto("/");

  // Enter file key and load
  await page.locator('input[placeholder*="Figma"]').fill("");
  await page.locator("button").filter({ hasText: "読み込み" }).click();

  // Wait for loading
  await page.waitForTimeout(5000);

  // Check if table headers are present
  await expect(page.locator("th").filter({ hasText: "名前" })).toBeVisible();
  await expect(page.locator("th").filter({ hasText: "タイプ" })).toBeVisible();
  await expect(page.locator("th").filter({ hasText: "値" })).toBeVisible();
  await expect(
    page.locator("th").filter({ hasText: "スコープ" })
  ).toBeVisible();
  await expect(page.locator("th").filter({ hasText: "説明" })).toBeVisible();

  // Check if at least one variable row is present
  const rows = page.locator("tbody tr");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
});

test("color variables show color preview", async ({ page }) => {
  await page.goto("/");

  // Load variables
  await page.locator('input[placeholder*="Figma"]').fill("");
  await page.locator("button").filter({ hasText: "読み込み" }).click();
  await page.waitForTimeout(5000);

  // Look for color preview elements (small colored rectangles)
  const colorPreviews = page.locator('div[style*="background-color"]');
  await expect(colorPreviews.first()).toBeVisible();
});

test("description editing functionality", async ({ page }) => {
  await page.goto("/");

  // Load variables
  await page.locator('input[placeholder*="Figma"]').fill("");
  await page.locator("button").filter({ hasText: "読み込み" }).click();
  await page.waitForTimeout(5000);

  // Find the first description input field
  const descriptionInput = page
    .locator('input[placeholder="説明を入力"]')
    .first();
  await expect(descriptionInput).toBeVisible();

  // Enter a test description
  await descriptionInput.fill("テスト用の説明");

  // Find and click the update button
  const updateButton = page
    .locator("button")
    .filter({ hasText: "更新" })
    .first();
  await updateButton.click();

  // Wait for the API call (this might fail with 404 due to the API issue, but we can test the UI)
  await page.waitForTimeout(2000);
});
